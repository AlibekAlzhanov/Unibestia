import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { In, Repository } from "typeorm";
import { z } from "zod";
import {
  FavoriteOffer,
  Offer,
  Redemption,
  RedemptionStatus,
  Review,
  ReviewStatus,
  User,
  UserStatus,
} from "@repo/db";
import { CatalogService } from "@repo/domain-services";
import { procedure, protectedProcedure, t } from "../base/index.js";

const listOffersInputSchema = z
  .object({
    categorySlug: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),
    featuredOnly: z.boolean().optional(),
    limit: z.number().int().min(1).max(50).default(12),
    offset: z.number().int().min(0).default(0),
  })
  .optional();

const listFavoritesInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(24),
    offset: z.number().int().min(0).default(0),
  })
  .optional();

type AuthContextLike = {
  auth: {
    userId: string | null;
    user?: {
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    } | null;
  };
};

function normalizeNullableText(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

@Injectable()
export class CatalogRouter {
  constructor(
    private readonly catalogService: CatalogService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Offer)
    private readonly offersRepo: Repository<Offer>,
    @InjectRepository(FavoriteOffer)
    private readonly favoriteOffersRepo: Repository<FavoriteOffer>,
    @InjectRepository(Redemption)
    private readonly redemptionsRepo: Repository<Redemption>,
    @InjectRepository(Review)
    private readonly reviewsRepo: Repository<Review>
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async getOrCreateCurrentUser(ctx: AuthContextLike): Promise<User> {
    if (!ctx.auth.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authenticated Clerk user ID is missing",
      });
    }

    const clerkEmail = ctx.auth.user?.email
      ? this.normalizeEmail(ctx.auth.user.email)
      : null;

    const existingByClerkId = await this.usersRepo.findOne({
      where: { clerkUserId: ctx.auth.userId },
    });

    if (existingByClerkId) {
      if (clerkEmail && existingByClerkId.email !== clerkEmail) {
        const userWithClerkEmail = await this.usersRepo.findOne({
          where: { email: clerkEmail },
        });

        if (userWithClerkEmail && userWithClerkEmail.id !== existingByClerkId.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Another local user already exists with current Clerk email",
          });
        }

        existingByClerkId.email = clerkEmail;
      }

      existingByClerkId.firstName =
        ctx.auth.user?.firstName ?? existingByClerkId.firstName;
      existingByClerkId.lastName =
        ctx.auth.user?.lastName ?? existingByClerkId.lastName;

      if (!existingByClerkId.avatarUrl && ctx.auth.user?.imageUrl) {
        existingByClerkId.avatarUrl = ctx.auth.user.imageUrl;
      }

      existingByClerkId.lastLoginAt = new Date();

      return this.usersRepo.save(existingByClerkId);
    }

    if (!clerkEmail) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Clerk primary email is required",
      });
    }

    const existingByEmail = await this.usersRepo.findOne({
      where: { email: clerkEmail },
    });

    if (existingByEmail) {
      existingByEmail.clerkUserId = ctx.auth.userId;
      existingByEmail.firstName =
        ctx.auth.user?.firstName ?? existingByEmail.firstName;
      existingByEmail.lastName =
        ctx.auth.user?.lastName ?? existingByEmail.lastName;

      if (!existingByEmail.avatarUrl && ctx.auth.user?.imageUrl) {
        existingByEmail.avatarUrl = ctx.auth.user.imageUrl;
      }

      existingByEmail.lastLoginAt = new Date();

      return this.usersRepo.save(existingByEmail);
    }

    const displayName = [ctx.auth.user?.firstName, ctx.auth.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const user = this.usersRepo.create({
      clerkUserId: ctx.auth.userId,
      email: clerkEmail,
      firstName: ctx.auth.user?.firstName ?? null,
      lastName: ctx.auth.user?.lastName ?? null,
      displayName: displayName || clerkEmail,
      avatarUrl: ctx.auth.user?.imageUrl ?? null,
      phone: null,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(),
    });

    return this.usersRepo.save(user);
  }

  private async getCurrentUser(ctx: AuthContextLike): Promise<User> {
    return this.getOrCreateCurrentUser(ctx);
  }

  private async getFavoriteOfferIdsForUser(userId: string): Promise<string[]> {
    const favorites = await this.favoriteOffersRepo.find({
      where: { userId },
      select: { offerId: true },
      order: { createdAt: "DESC" },
    });

    return favorites.map((favorite) => favorite.offerId);
  }

  private mapReview(review: Review) {
    return {
      id: review.id,
      userId: review.userId,
      offerId: review.offerId,
      redemptionId: review.redemptionId,
      rating: review.rating,
      text: review.text,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  public readonly router = t.router({
    listCategories: procedure.query(async () => {
      return this.catalogService.listCategories();
    }),

    getHomeOffers: procedure.query(async () => {
      try {
        return await this.catalogService.getHomeOffers();
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to load home offers",
        });
      }
    }),

    listOffers: procedure
      .input(listOffersInputSchema)
      .query(async ({ input }) => {
        try {
          return await this.catalogService.listOffers(
            input ?? {
              limit: 12,
              offset: 0,
            }
          );
        } catch (error) {
          if (error instanceof Error && error.message.includes("not found")) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error ? error.message : "Failed to list offers",
          });
        }
      }),

    getOfferBySlug: procedure
      .input(
        z.object({
          slug: z.string().trim().min(1),
        })
      )
      .query(async ({ input }) => {
        try {
          return await this.catalogService.getOfferBySlug(input.slug);
        } catch (error) {
          if (error instanceof Error && error.message.includes("not found")) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error ? error.message : "Failed to load offer",
          });
        }
      }),

    getFavoriteOfferIds: protectedProcedure.query(async ({ ctx }) => {
      const user = await this.getCurrentUser(ctx);
      return this.getFavoriteOfferIdsForUser(user.id);
    }),

    listFavorites: protectedProcedure
      .input(listFavoritesInputSchema)
      .query(async ({ ctx, input }) => {
        const user = await this.getCurrentUser(ctx);
        const limit = input?.limit ?? 24;
        const offset = input?.offset ?? 0;

        const [favorites, total] = await this.favoriteOffersRepo.findAndCount({
          where: { userId: user.id },
          order: { createdAt: "DESC" },
          take: limit,
          skip: offset,
        });

        if (favorites.length === 0) {
          return {
            total,
            limit,
            offset,
            items: [],
          };
        }

        const catalogOffers = await this.catalogService.listOffers({
          limit: 50,
          offset: 0,
        });

        const catalogOfferMap = new Map(
          catalogOffers.items.map((offer) => [offer.id, offer])
        );

        return {
          total,
          limit,
          offset,
          items: favorites
            .map((favorite) => {
              const offer = catalogOfferMap.get(favorite.offerId);

              if (!offer) {
                return null;
              }

              return {
                ...offer,
                favoritedAt: favorite.createdAt,
              };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item)),
        };
      }),

    toggleFavorite: protectedProcedure
      .input(
        z.object({
          offerId: z.string().uuid(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await this.getCurrentUser(ctx);

        const offer = await this.offersRepo.findOne({
          where: { id: input.offerId },
        });

        if (!offer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Offer not found",
          });
        }

        const existing = await this.favoriteOffersRepo.findOne({
          where: {
            userId: user.id,
            offerId: input.offerId,
          },
        });

        if (existing) {
          await this.favoriteOffersRepo.delete(existing.id);

          return {
            offerId: input.offerId,
            isFavorite: false,
          };
        }

        const created = this.favoriteOffersRepo.create({
          userId: user.id,
          offerId: input.offerId,
        });

        await this.favoriteOffersRepo.save(created);

        return {
          offerId: input.offerId,
          isFavorite: true,
        };
      }),

    getMyReviewEligibility: protectedProcedure
      .input(
        z.object({
          offerId: z.string().uuid(),
        })
      )
      .query(async ({ ctx, input }) => {
        const user = await this.getCurrentUser(ctx);

        const redemptions = await this.redemptionsRepo.find({
          where: {
            userId: user.id,
            offerId: input.offerId,
            status: RedemptionStatus.USED,
          },
          order: {
            usedAt: "DESC",
            createdAt: "DESC",
          },
        });

        const redemptionIds = redemptions.map((redemption) => redemption.id);
        const reviews = redemptionIds.length
          ? await this.reviewsRepo.find({
              where: {
                userId: user.id,
                offerId: input.offerId,
                redemptionId: In(redemptionIds),
              },
            })
          : [];

        const reviewsByRedemptionId = new Map(
          reviews.map((review) => [review.redemptionId, review])
        );

        const usedRedemptions = redemptions.map((redemption) => {
          const review = reviewsByRedemptionId.get(redemption.id) ?? null;

          return {
            id: redemption.id,
            status: redemption.status,
            usedAt: redemption.usedAt,
            createdAt: redemption.createdAt,
            hasReview: Boolean(review),
            review: review ? this.mapReview(review) : null,
          };
        });

        const reviewableRedemption = usedRedemptions.find(
          (redemption) => !redemption.hasReview
        );

        return {
          canReview: Boolean(reviewableRedemption),
          reviewableRedemptionId: reviewableRedemption?.id ?? null,
          usedCount: usedRedemptions.length,
          reviewedCount: reviews.length,
          usedRedemptions,
        };
      }),

    createReview: protectedProcedure
      .input(
        z.object({
          redemptionId: z.string().uuid(),
          rating: z.number().int().min(1).max(5),
          text: z.string().trim().max(1000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await this.getCurrentUser(ctx);

        const redemption = await this.redemptionsRepo.findOne({
          where: {
            id: input.redemptionId,
            userId: user.id,
          },
        });

        if (!redemption) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Used redemption not found for current user",
          });
        }

        if (redemption.status !== RedemptionStatus.USED) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Review can be created only after QR usage is confirmed",
          });
        }

        const existing = await this.reviewsRepo.findOne({
          where: {
            redemptionId: redemption.id,
          },
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Review already exists for this redemption",
          });
        }

        const review = this.reviewsRepo.create({
          userId: user.id,
          offerId: redemption.offerId,
          redemptionId: redemption.id,
          rating: input.rating,
          text: normalizeNullableText(input.text),
          status: ReviewStatus.VISIBLE,
          moderatedByUserId: null,
          moderatedAt: null,
          moderationComment: null,
        });

        const saved = await this.reviewsRepo.save(review);

        return this.mapReview(saved);
      }),
  });
}

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { In, Repository } from "typeorm";
import { z } from "zod";
import {
  FavoriteOffer,
  Offer,
  OfferCategory,
  OfferMedia,
  OfferStatus,
  Partner,
  User,
  UserStatus,
} from "@repo/db";
import { CatalogService } from "@repo/domain-services";
import { procedure, protectedProcedure, t } from "../base/index.js";

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

function uniqueNonEmptyIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function normalizeLimit(limit: number): number {
  return Math.min(Math.max(limit, 1), 50);
}

function normalizeOffset(offset: number): number {
  return Math.max(offset, 0);
}

@Injectable()
export class CatalogRouter {
  constructor(
    private readonly catalogService: CatalogService,
    @InjectRepository(FavoriteOffer)
    private readonly favoriteOffersRepo: Repository<FavoriteOffer>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Offer)
    private readonly offersRepo: Repository<Offer>,
    @InjectRepository(OfferMedia)
    private readonly offerMediaRepo: Repository<OfferMedia>,
    @InjectRepository(OfferCategory)
    private readonly offerCategoriesRepo: Repository<OfferCategory>,
    @InjectRepository(Partner)
    private readonly partnersRepo: Repository<Partner>
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
            message: "Another local user already exists with current Clerk email",
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

  private async getFavoriteOfferIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.favoriteOffersRepo
      .createQueryBuilder("favorite")
      .innerJoin(Offer, "offer", "offer.id = favorite.offerId")
      .where("favorite.userId = :userId", { userId })
      .andWhere("offer.status = :status", { status: OfferStatus.PUBLISHED })
      .select(["favorite.offerId"])
      .orderBy("favorite.createdAt", "DESC")
      .getMany();

    return rows.map((row) => row.offerId);
  }

  private async getOfferCoverMap(offerIds: string[]): Promise<Map<string, OfferMedia>> {
    const uniqueOfferIds = uniqueNonEmptyIds(offerIds);

    if (uniqueOfferIds.length === 0) {
      return new Map<string, OfferMedia>();
    }

    const media = await this.offerMediaRepo
      .createQueryBuilder("media")
      .distinctOn(["media.offerId"])
      .where("media.offerId IN (:...offerIds)", { offerIds: uniqueOfferIds })
      .orderBy("media.offerId", "ASC")
      .addOrderBy("media.isCover", "DESC")
      .addOrderBy("media.sortOrder", "ASC")
      .addOrderBy("media.createdAt", "ASC")
      .getMany();

    return new Map(media.map((item) => [item.offerId, item]));
  }

  private async getPartnerMap(partnerIds: string[]): Promise<Map<string, Partner>> {
    const uniquePartnerIds = uniqueNonEmptyIds(partnerIds);

    if (uniquePartnerIds.length === 0) {
      return new Map<string, Partner>();
    }

    const partners = await this.partnersRepo
      .createQueryBuilder("partner")
      .select(["partner.id", "partner.brandName", "partner.logoUrl"])
      .where("partner.id IN (:...partnerIds)", { partnerIds: uniquePartnerIds })
      .getMany();

    return new Map(partners.map((partner) => [partner.id, partner]));
  }

  private async getCategoryMap(
    categoryIds: string[]
  ): Promise<Map<string, OfferCategory>> {
    const uniqueCategoryIds = uniqueNonEmptyIds(categoryIds);

    if (uniqueCategoryIds.length === 0) {
      return new Map<string, OfferCategory>();
    }

    const categories = await this.offerCategoriesRepo
      .createQueryBuilder("category")
      .select(["category.id", "category.name", "category.slug"])
      .where("category.id IN (:...categoryIds)", { categoryIds: uniqueCategoryIds })
      .getMany();

    return new Map(categories.map((category) => [category.id, category]));
  }

  private async buildOfferCards(
    offers: Offer[],
    favoriteOfferIds: Set<string>
  ) {
    const offerIds = offers.map((offer) => offer.id);
    const partnerIds = uniqueNonEmptyIds(offers.map((offer) => offer.partnerId));
    const categoryIds = uniqueNonEmptyIds(offers.map((offer) => offer.categoryId));

    const [coverMap, partnerMap, categoryMap] = await Promise.all([
      this.getOfferCoverMap(offerIds),
      this.getPartnerMap(partnerIds),
      this.getCategoryMap(categoryIds),
    ]);

    return offers.map((offer) => {
      const cover = coverMap.get(offer.id) ?? null;
      const partner = partnerMap.get(offer.partnerId) ?? null;
      const offerCategory = categoryMap.get(offer.categoryId) ?? null;

      return {
        id: offer.id,
        slug: offer.slug,
        title: offer.title,
        shortDescription: offer.shortDescription,
        benefitType: offer.benefitType,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        cashbackPercent: offer.cashbackPercent,
        bonusRewardPoints: offer.bonusRewardPoints,
        minPurchaseAmount: offer.minPurchaseAmount,
        startAt: offer.startAt,
        endAt: offer.endAt,
        isFeatured: offer.isFeatured,
        publishedAt: offer.publishedAt,
        isFavorite: favoriteOfferIds.has(offer.id),
        category: offerCategory
          ? {
              id: offerCategory.id,
              name: offerCategory.name,
              slug: offerCategory.slug,
            }
          : null,
        partner: partner
          ? {
              id: partner.id,
              brandName: partner.brandName,
              logoUrl: partner.logoUrl,
            }
          : null,
        coverMedia: cover
          ? {
              id: cover.id,
              mediaType: cover.mediaType,
              fileUrl: cover.fileUrl,
              isCover: cover.isCover,
            }
          : null,
      };
    });
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
      const user = await this.getOrCreateCurrentUser(ctx);
      return this.getFavoriteOfferIdsForUser(user.id);
    }),

    listFavorites: protectedProcedure
      .input(listFavoritesInputSchema)
      .query(async ({ ctx, input }) => {
        const user = await this.getOrCreateCurrentUser(ctx);
        const limit = normalizeLimit(input?.limit ?? 24);
        const offset = normalizeOffset(input?.offset ?? 0);

        const qb = this.favoriteOffersRepo
          .createQueryBuilder("favorite")
          .innerJoin(Offer, "offer", "offer.id = favorite.offerId")
          .where("favorite.userId = :userId", { userId: user.id })
          .andWhere("offer.status = :status", { status: OfferStatus.PUBLISHED })
          .orderBy("favorite.createdAt", "DESC")
          .skip(offset)
          .take(limit);

        const [favorites, total] = await qb.getManyAndCount();
        const offerIds = favorites.map((favorite) => favorite.offerId);

        if (offerIds.length === 0) {
          return {
            total,
            limit,
            offset,
            items: [],
          };
        }

        const offers = await this.offersRepo.find({
          where: {
            id: In(offerIds),
            status: OfferStatus.PUBLISHED,
          },
        });

        const offerMap = new Map(offers.map((offer) => [offer.id, offer]));
        const sortedOffers = offerIds
          .map((offerId) => offerMap.get(offerId))
          .filter((offer): offer is Offer => Boolean(offer));

        const cards = await this.buildOfferCards(
          sortedOffers,
          new Set(offerIds)
        );

        return {
          total,
          limit,
          offset,
          items: cards,
        };
      }),

    toggleFavorite: protectedProcedure
      .input(
        z.object({
          offerId: z.string().uuid(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await this.getOrCreateCurrentUser(ctx);

        const offer = await this.offersRepo.findOne({
          where: {
            id: input.offerId,
            status: OfferStatus.PUBLISHED,
          },
        });

        if (!offer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Published offer not found",
          });
        }

        const existing = await this.favoriteOffersRepo.findOne({
          where: {
            userId: user.id,
            offerId: offer.id,
          },
        });

        if (existing) {
          await this.favoriteOffersRepo.delete(existing.id);

          return {
            offerId: offer.id,
            isFavorite: false,
          };
        }

        await this.favoriteOffersRepo
          .createQueryBuilder()
          .insert()
          .into(FavoriteOffer)
          .values({
            userId: user.id,
            offerId: offer.id,
          })
          .orIgnore()
          .execute();

        return {
          offerId: offer.id,
          isFavorite: true,
        };
      }),
  });
}

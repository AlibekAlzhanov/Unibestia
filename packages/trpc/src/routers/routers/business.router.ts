import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { In, Repository } from "typeorm";
import {
  Offer,
  OfferBenefitType,
  OfferCategory,
  OfferDiscountType,
  OfferLocation,
  OfferStatus,
  Partner,
  PartnerLocation,
  PartnerStatus,
  Redemption,
  RedemptionStatus,
  User,
} from "@repo/db";
import { procedure, t } from "../base/index.js";
import { z } from "zod";

@Injectable()
export class BusinessRouter {
  constructor(
    @InjectRepository(Partner)
    private readonly partnersRepo: Repository<Partner>,
    @InjectRepository(Offer)
    private readonly offersRepo: Repository<Offer>,
    @InjectRepository(OfferCategory)
    private readonly offerCategoriesRepo: Repository<OfferCategory>,
    @InjectRepository(OfferLocation)
    private readonly offerLocationsRepo: Repository<OfferLocation>,
    @InjectRepository(Redemption)
    private readonly redemptionsRepo: Repository<Redemption>,
    @InjectRepository(PartnerLocation)
    private readonly partnerLocationsRepo: Repository<PartnerLocation>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>
  ) {}

  private async getDemoPartner(): Promise<Partner | null> {
    const approved = await this.partnersRepo.findOne({
      where: { status: PartnerStatus.APPROVED },
      order: { createdAt: "ASC" },
    });

    if (approved) {
      return approved;
    }

    return this.partnersRepo.findOne({
      where: {},
      order: { createdAt: "ASC" },
    });
  }

  private slugify(value: string): string {
    const normalized = value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    return normalized || "offer";
  }

  private makeUniqueSlug(title: string): string {
    return `${this.slugify(title)}-${randomUUID().slice(0, 8)}`;
  }

  private async getOffersMap(offerIds: string[]) {
    if (offerIds.length === 0) {
      return new Map<string, Offer>();
    }

    const offers = await this.offersRepo.find({
      where: { id: In(offerIds) },
    });

    return new Map(offers.map((offer) => [offer.id, offer]));
  }

  private async getUsersMap(userIds: string[]) {
    if (userIds.length === 0) {
      return new Map<string, User>();
    }

    const users = await this.usersRepo.find({
      where: { id: In(userIds) },
    });

    return new Map(users.map((user) => [user.id, user]));
  }

  private async getLocationsMap(locationIds: string[]) {
    if (locationIds.length === 0) {
      return new Map<string, PartnerLocation>();
    }

    const locations = await this.partnerLocationsRepo.find({
      where: { id: In(locationIds) },
    });

    return new Map(locations.map((location) => [location.id, location]));
  }

  private async getPartnersMap(partnerIds: string[]) {
    if (partnerIds.length === 0) {
      return new Map<string, Partner>();
    }

    const partners = await this.partnersRepo.find({
      where: { id: In(partnerIds) },
    });

    return new Map(partners.map((partner) => [partner.id, partner]));
  }

  private async updateOfferStatus(
    offerId: string,
    status: OfferStatus
  ): Promise<Offer> {
    const offer = await this.offersRepo.findOne({
      where: { id: offerId },
    });

    if (!offer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Offer not found",
      });
    }

    offer.status = status;

    if (status === OfferStatus.PUBLISHED) {
      offer.publishedAt = new Date();
    }

    if (status !== OfferStatus.PUBLISHED) {
      offer.publishedAt = null;
    }

    return this.offersRepo.save(offer);
  }

  private async buildPartnerSummary(partner: Partner | null) {
    if (!partner) {
      return {
        partner: null,
        metrics: {
          totalOffers: 0,
          publishedOffers: 0,
          draftOffers: 0,
          totalRedemptions: 0,
          usedRedemptions: 0,
          activeLocations: 0,
          totalDiscountAmount: 0,
          totalOrderAmount: 0,
        },
        recentRedemptions: [],
      };
    }

    const [
      totalOffers,
      publishedOffers,
      draftOffers,
      totalRedemptions,
      usedRedemptions,
      activeLocations,
      recentRedemptions,
    ] = await Promise.all([
      this.offersRepo.count({ where: { partnerId: partner.id } }),
      this.offersRepo.count({
        where: { partnerId: partner.id, status: OfferStatus.PUBLISHED },
      }),
      this.offersRepo.count({
        where: { partnerId: partner.id, status: OfferStatus.DRAFT },
      }),
      this.redemptionsRepo.count({ where: { partnerId: partner.id } }),
      this.redemptionsRepo.count({
        where: { partnerId: partner.id, status: RedemptionStatus.USED },
      }),
      this.partnerLocationsRepo.count({
        where: { partnerId: partner.id, isActive: true },
      }),
      this.redemptionsRepo.find({
        where: { partnerId: partner.id },
        order: { createdAt: "DESC" },
        take: 6,
      }),
    ]);

    const usedRows = await this.redemptionsRepo.find({
      where: { partnerId: partner.id, status: RedemptionStatus.USED },
      select: {
        id: true,
        orderAmount: true,
        discountAmount: true,
      },
    });

    const totalOrderAmount = usedRows.reduce(
      (sum, item) => sum + Number(item.orderAmount ?? 0),
      0
    );
    const totalDiscountAmount = usedRows.reduce(
      (sum, item) => sum + Number(item.discountAmount ?? 0),
      0
    );

    const offersMap = await this.getOffersMap(
      recentRedemptions.map((item) => item.offerId)
    );
    const usersMap = await this.getUsersMap(
      recentRedemptions.map((item) => item.userId)
    );
    const locationsMap = await this.getLocationsMap(
      recentRedemptions
        .map((item) => item.locationId)
        .filter((value): value is string => Boolean(value))
    );

    return {
      partner: {
        id: partner.id,
        brandName: partner.brandName,
        legalName: partner.legalName,
        status: partner.status,
        logoUrl: partner.logoUrl,
        contactEmail: partner.contactEmail,
      },
      metrics: {
        totalOffers,
        publishedOffers,
        draftOffers,
        totalRedemptions,
        usedRedemptions,
        activeLocations,
        totalDiscountAmount,
        totalOrderAmount,
      },
      recentRedemptions: recentRedemptions.map((item) => {
        const offer = offersMap.get(item.offerId) ?? null;
        const user = usersMap.get(item.userId) ?? null;
        const location = item.locationId
          ? locationsMap.get(item.locationId) ?? null
          : null;

        return {
          id: item.id,
          status: item.status,
          qrToken: item.qrToken,
          orderAmount: item.orderAmount,
          discountAmount: item.discountAmount,
          createdAt: item.createdAt,
          usedAt: item.usedAt,
          offer: offer
            ? {
                id: offer.id,
                title: offer.title,
                slug: offer.slug,
              }
            : null,
          student: user
            ? {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : null,
          location: location
            ? {
                id: location.id,
                name: location.name,
                city: location.city,
                address: location.address,
              }
            : null,
        };
      }),
    };
  }

  public readonly router = t.router({
    partner: t.router({
      getDashboard: procedure.query(async () => {
        const partner = await this.getDemoPartner();
        return this.buildPartnerSummary(partner);
      }),

      listLocations: procedure.query(async () => {
        const partner = await this.getDemoPartner();

        if (!partner) {
          return {
            partner: null,
            items: [],
          };
        }

        const items = await this.partnerLocationsRepo.find({
          where: { partnerId: partner.id },
          order: { isActive: "DESC", name: "ASC" },
        });

        return {
          partner: {
            id: partner.id,
            brandName: partner.brandName,
            status: partner.status,
          },
          items: items.map((location) => ({
            id: location.id,
            name: location.name,
            city: location.city,
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
            isActive: location.isActive,
            createdAt: location.createdAt,
          })),
        };
      }),

      createLocation: procedure
        .input(
          z.object({
            name: z.string().trim().min(2).max(255),
            city: z.string().trim().max(100).optional(),
            address: z.string().trim().min(5),
            latitude: z.number().min(-90).max(90).optional(),
            longitude: z.number().min(-180).max(180).optional(),
          })
        )
        .mutation(async ({ input }) => {
          const partner = await this.getDemoPartner();

          if (!partner) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Demo partner not found",
            });
          }

          const location = this.partnerLocationsRepo.create({
            partnerId: partner.id,
            name: input.name,
            city: input.city ?? null,
            address: input.address,
            latitude:
              typeof input.latitude === "number"
                ? input.latitude.toFixed(6)
                : null,
            longitude:
              typeof input.longitude === "number"
                ? input.longitude.toFixed(6)
                : null,
            isActive: true,
          });

          const saved = await this.partnerLocationsRepo.save(location);

          return {
            id: saved.id,
            name: saved.name,
            city: saved.city,
            address: saved.address,
            latitude: saved.latitude,
            longitude: saved.longitude,
            isActive: saved.isActive,
            createdAt: saved.createdAt,
          };
        }),

      createOffer: procedure
        .input(
          z.object({
            categoryId: z.string().uuid(),
            title: z.string().trim().min(3).max(255),
            shortDescription: z.string().trim().max(500).optional(),
            description: z.string().trim().min(10),
            terms: z.string().trim().max(2000).optional(),
            benefitType: z
              .enum(["discount", "bonus", "cashback", "mixed"])
              .default("discount"),
            discountType: z.enum(["percent", "fixed_amount"]).default("percent"),
            discountValue: z.number().min(0).optional(),
            cashbackPercent: z.number().min(0).max(100).optional(),
            bonusRewardPoints: z.number().int().min(0).optional(),
            minPurchaseAmount: z.number().min(0).optional(),
            usageLimitPerUser: z.number().int().min(1).optional(),
            totalUsageLimit: z.number().int().min(1).optional(),
            startAt: z.string().datetime().optional(),
            endAt: z.string().datetime().optional(),
            locationIds: z.array(z.string().uuid()).optional().default([]),
            submitForReview: z.boolean().default(false),
          })
        )
        .mutation(async ({ input }) => {
          const partner = await this.getDemoPartner();

          if (!partner) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Demo partner not found",
            });
          }

          const category = await this.offerCategoriesRepo.findOne({
            where: { id: input.categoryId, isActive: true },
          });

          if (!category) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Offer category not found",
            });
          }

          const isDiscountBenefit =
            input.benefitType === "discount" || input.benefitType === "mixed";
          const isCashbackBenefit =
            input.benefitType === "cashback" || input.benefitType === "mixed";
          const isBonusBenefit =
            input.benefitType === "bonus" || input.benefitType === "mixed";

          if (
            input.benefitType === "discount" &&
            typeof input.discountValue !== "number"
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Discount value is required for discount offers",
            });
          }

          if (
            input.benefitType === "cashback" &&
            typeof input.cashbackPercent !== "number"
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cashback percent is required for cashback offers",
            });
          }

          if (
            input.benefitType === "bonus" &&
            typeof input.bonusRewardPoints !== "number"
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Bonus reward points are required for bonus offers",
            });
          }

          if (
            input.benefitType === "mixed" &&
            typeof input.discountValue !== "number" &&
            typeof input.cashbackPercent !== "number" &&
            typeof input.bonusRewardPoints !== "number"
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Mixed offer must include at least one benefit: discount, cashback, or bonus",
            });
          }

          const startAt = input.startAt ? new Date(input.startAt) : new Date();
          const endAt = input.endAt ? new Date(input.endAt) : null;

          if (endAt && endAt <= startAt) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "End date must be later than start date",
            });
          }

          const offer = this.offersRepo.create({
            partnerId: partner.id,
            categoryId: category.id,
            title: input.title,
            slug: this.makeUniqueSlug(input.title),
            shortDescription: input.shortDescription ?? null,
            description: input.description,
            benefitType: input.benefitType as OfferBenefitType,
            discountType: isDiscountBenefit
              ? (input.discountType as OfferDiscountType)
              : null,
            discountValue:
              isDiscountBenefit && typeof input.discountValue === "number"
                ? input.discountValue.toFixed(2)
                : null,
            cashbackPercent:
              isCashbackBenefit && typeof input.cashbackPercent === "number"
                ? input.cashbackPercent.toFixed(2)
                : null,
            bonusRewardPoints: isBonusBenefit
              ? input.bonusRewardPoints ?? null
              : null,
            minPurchaseAmount:
              typeof input.minPurchaseAmount === "number"
                ? input.minPurchaseAmount.toFixed(2)
                : null,
            terms: input.terms ?? null,
            usageLimitPerUser: input.usageLimitPerUser ?? null,
            totalUsageLimit: input.totalUsageLimit ?? null,
            startAt,
            endAt,
            status: input.submitForReview
              ? OfferStatus.PENDING_REVIEW
              : OfferStatus.DRAFT,
            isFeatured: false,
            publishedAt: null,
            createdByUserId: partner.createdByUserId,
            updatedByUserId: null,
          });

          const saved = await this.offersRepo.save(offer);

          const selectedLocations =
            input.locationIds.length > 0
              ? await this.partnerLocationsRepo.find({
                  where: {
                    id: In(input.locationIds),
                    partnerId: partner.id,
                    isActive: true,
                  },
                })
              : await this.partnerLocationsRepo.find({
                  where: {
                    partnerId: partner.id,
                    isActive: true,
                  },
                });

          if (
            input.locationIds.length > 0 &&
            selectedLocations.length !== input.locationIds.length
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "One or more selected locations do not belong to this partner",
            });
          }

          if (selectedLocations.length > 0) {
            await this.offerLocationsRepo.save(
              selectedLocations.map((location) =>
                this.offerLocationsRepo.create({
                  offerId: saved.id,
                  locationId: location.id,
                })
              )
            );
          }

          return {
            id: saved.id,
            title: saved.title,
            slug: saved.slug,
            status: saved.status,
            category: {
              id: category.id,
              name: category.name,
              slug: category.slug,
            },
            partner: {
              id: partner.id,
              brandName: partner.brandName,
            },
            locations: selectedLocations.map((location) => ({
              id: location.id,
              name: location.name,
              city: location.city,
              address: location.address,
            })),
          };
        }),

      listOffers: procedure
        .input(
          z
            .object({
              limit: z.number().int().min(1).max(100).default(50),
              offset: z.number().int().min(0).default(0),
            })
            .optional()
        )
        .query(async ({ input }) => {
          const partner = await this.getDemoPartner();

          if (!partner) {
            return {
              partner: null,
              total: 0,
              items: [],
            };
          }

          const [items, total] = await this.offersRepo.findAndCount({
            where: { partnerId: partner.id },
            order: { createdAt: "DESC" },
            take: input?.limit ?? 50,
            skip: input?.offset ?? 0,
          });

          const redemptionCounts = await Promise.all(
            items.map(async (offer) => ({
              offerId: offer.id,
              total: await this.redemptionsRepo.count({
                where: { offerId: offer.id },
              }),
              used: await this.redemptionsRepo.count({
                where: {
                  offerId: offer.id,
                  status: RedemptionStatus.USED,
                },
              }),
            }))
          );

          const countsMap = new Map(
            redemptionCounts.map((item) => [item.offerId, item])
          );

          return {
            partner: {
              id: partner.id,
              brandName: partner.brandName,
              status: partner.status,
            },
            total,
            items: items.map((offer) => {
              const counts = countsMap.get(offer.id);

              return {
                id: offer.id,
                title: offer.title,
                slug: offer.slug,
                shortDescription: offer.shortDescription,
                status: offer.status,
                benefitType: offer.benefitType,
                discountType: offer.discountType,
                discountValue: offer.discountValue,
                cashbackPercent: offer.cashbackPercent,
                bonusRewardPoints: offer.bonusRewardPoints,
                isFeatured: offer.isFeatured,
                publishedAt: offer.publishedAt,
                createdAt: offer.createdAt,
                redemptions: {
                  total: counts?.total ?? 0,
                  used: counts?.used ?? 0,
                },
              };
            }),
          };
        }),

      listRedemptions: procedure
        .input(
          z
            .object({
              limit: z.number().int().min(1).max(100).default(50),
              offset: z.number().int().min(0).default(0),
            })
            .optional()
        )
        .query(async ({ input }) => {
          const partner = await this.getDemoPartner();

          if (!partner) {
            return {
              partner: null,
              total: 0,
              items: [],
            };
          }

          const [items, total] = await this.redemptionsRepo.findAndCount({
            where: { partnerId: partner.id },
            order: { createdAt: "DESC" },
            take: input?.limit ?? 50,
            skip: input?.offset ?? 0,
          });

          const offersMap = await this.getOffersMap(
            items.map((item) => item.offerId)
          );
          const usersMap = await this.getUsersMap(
            items.map((item) => item.userId)
          );
          const locationsMap = await this.getLocationsMap(
            items
              .map((item) => item.locationId)
              .filter((value): value is string => Boolean(value))
          );

          return {
            partner: {
              id: partner.id,
              brandName: partner.brandName,
              status: partner.status,
            },
            total,
            items: items.map((item) => {
              const offer = offersMap.get(item.offerId) ?? null;
              const user = usersMap.get(item.userId) ?? null;
              const location = item.locationId
                ? locationsMap.get(item.locationId) ?? null
                : null;

              return {
                id: item.id,
                status: item.status,
                qrToken: item.qrToken,
                qrExpiresAt: item.qrExpiresAt,
                orderAmount: item.orderAmount,
                discountAmount: item.discountAmount,
                bonusEarned: item.bonusEarned,
                bonusSpent: item.bonusSpent,
                usedAt: item.usedAt,
                cancelledAt: item.cancelledAt,
                createdAt: item.createdAt,
                offer: offer
                  ? {
                      id: offer.id,
                      title: offer.title,
                      slug: offer.slug,
                    }
                  : null,
                student: user
                  ? {
                      id: user.id,
                      email: user.email,
                      displayName: user.displayName,
                      firstName: user.firstName,
                      lastName: user.lastName,
                    }
                  : null,
                location: location
                  ? {
                      id: location.id,
                      name: location.name,
                      city: location.city,
                      address: location.address,
                    }
                  : null,
              };
            }),
          };
        }),

      getAnalytics: procedure.query(async () => {
        const partner = await this.getDemoPartner();
        const summary = await this.buildPartnerSummary(partner);

        if (!partner) {
          return {
            ...summary,
            topOffers: [],
            statusBreakdown: [],
          };
        }

        const offers = await this.offersRepo.find({
          where: { partnerId: partner.id },
          order: { createdAt: "DESC" },
        });

        const topOffers = await Promise.all(
          offers.map(async (offer) => {
            const total = await this.redemptionsRepo.count({
              where: { offerId: offer.id },
            });
            const used = await this.redemptionsRepo.count({
              where: { offerId: offer.id, status: RedemptionStatus.USED },
            });

            return {
              id: offer.id,
              title: offer.title,
              slug: offer.slug,
              totalRedemptions: total,
              usedRedemptions: used,
            };
          })
        );

        const statusBreakdown = await Promise.all(
          Object.values(RedemptionStatus).map(async (status) => ({
            status,
            count: await this.redemptionsRepo.count({
              where: { partnerId: partner.id, status },
            }),
          }))
        );

        return {
          ...summary,
          topOffers: topOffers.sort(
            (a, b) => b.totalRedemptions - a.totalRedemptions
          ),
          statusBreakdown,
        };
      }),
    }),

    admin: t.router({
      listOffers: procedure
        .input(
          z
            .object({
              status: z
                .enum([
                  "draft",
                  "pending_review",
                  "approved",
                  "published",
                  "rejected",
                  "archived",
                ])
                .optional(),
              limit: z.number().int().min(1).max(100).default(100),
              offset: z.number().int().min(0).default(0),
            })
            .optional()
        )
        .query(async ({ input }) => {
          const where = input?.status
            ? { status: input.status as OfferStatus }
            : {};

          const [items, total] = await this.offersRepo.findAndCount({
            where,
            order: { createdAt: "DESC" },
            take: input?.limit ?? 100,
            skip: input?.offset ?? 0,
          });

          const partnersMap = await this.getPartnersMap(
            items.map((offer) => offer.partnerId)
          );

          return {
            total,
            items: items.map((offer) => {
              const partner = partnersMap.get(offer.partnerId) ?? null;

              return {
                id: offer.id,
                partnerId: offer.partnerId,
                title: offer.title,
                slug: offer.slug,
                shortDescription: offer.shortDescription,
                status: offer.status,
                benefitType: offer.benefitType,
                discountType: offer.discountType,
                discountValue: offer.discountValue,
                cashbackPercent: offer.cashbackPercent,
                bonusRewardPoints: offer.bonusRewardPoints,
                isFeatured: offer.isFeatured,
                startAt: offer.startAt,
                endAt: offer.endAt,
                publishedAt: offer.publishedAt,
                createdAt: offer.createdAt,
                partner: partner
                  ? {
                      id: partner.id,
                      brandName: partner.brandName,
                      legalName: partner.legalName,
                      status: partner.status,
                    }
                  : null,
              };
            }),
          };
        }),

      approveOffer: procedure
        .input(z.object({ offerId: z.string().uuid() }))
        .mutation(async ({ input }) => {
          const offer = await this.updateOfferStatus(
            input.offerId,
            OfferStatus.APPROVED
          );

          return {
            id: offer.id,
            title: offer.title,
            slug: offer.slug,
            status: offer.status,
          };
        }),

      publishOffer: procedure
        .input(z.object({ offerId: z.string().uuid() }))
        .mutation(async ({ input }) => {
          const offer = await this.updateOfferStatus(
            input.offerId,
            OfferStatus.PUBLISHED
          );

          return {
            id: offer.id,
            title: offer.title,
            slug: offer.slug,
            status: offer.status,
            publishedAt: offer.publishedAt,
          };
        }),

      rejectOffer: procedure
        .input(z.object({ offerId: z.string().uuid() }))
        .mutation(async ({ input }) => {
          const offer = await this.updateOfferStatus(
            input.offerId,
            OfferStatus.REJECTED
          );

          return {
            id: offer.id,
            title: offer.title,
            slug: offer.slug,
            status: offer.status,
          };
        }),

      archiveOffer: procedure
        .input(z.object({ offerId: z.string().uuid() }))
        .mutation(async ({ input }) => {
          const offer = await this.updateOfferStatus(
            input.offerId,
            OfferStatus.ARCHIVED
          );

          return {
            id: offer.id,
            title: offer.title,
            slug: offer.slug,
            status: offer.status,
          };
        }),

      getDashboard: procedure.query(async () => {
        const [
          totalUsers,
          totalPartners,
          approvedPartners,
          pendingPartners,
          totalOffers,
          publishedOffers,
          pendingOffers,
          totalRedemptions,
          usedRedemptions,
          cancelledRedemptions,
        ] = await Promise.all([
          this.usersRepo.count(),
          this.partnersRepo.count(),
          this.partnersRepo.count({
            where: { status: PartnerStatus.APPROVED },
          }),
          this.partnersRepo.count({
            where: { status: PartnerStatus.PENDING },
          }),
          this.offersRepo.count(),
          this.offersRepo.count({
            where: { status: OfferStatus.PUBLISHED },
          }),
          this.offersRepo.count({
            where: { status: OfferStatus.PENDING_REVIEW },
          }),
          this.redemptionsRepo.count(),
          this.redemptionsRepo.count({
            where: { status: RedemptionStatus.USED },
          }),
          this.redemptionsRepo.count({
            where: { status: RedemptionStatus.CANCELLED },
          }),
        ]);

        const recentPartners = await this.partnersRepo.find({
          order: { createdAt: "DESC" },
          take: 5,
        });

        const recentOffers = await this.offersRepo.find({
          order: { createdAt: "DESC" },
          take: 5,
        });

        return {
          metrics: {
            totalUsers,
            totalPartners,
            approvedPartners,
            pendingPartners,
            totalOffers,
            publishedOffers,
            pendingOffers,
            totalRedemptions,
            usedRedemptions,
            cancelledRedemptions,
          },
          recentPartners: recentPartners.map((partner) => ({
            id: partner.id,
            brandName: partner.brandName,
            legalName: partner.legalName,
            status: partner.status,
            createdAt: partner.createdAt,
          })),
          recentOffers: recentOffers.map((offer) => ({
            id: offer.id,
            title: offer.title,
            slug: offer.slug,
            status: offer.status,
            createdAt: offer.createdAt,
          })),
        };
      }),
    }),
  });
}

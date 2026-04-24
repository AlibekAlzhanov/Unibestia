import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import {
  Offer,
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

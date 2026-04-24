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
  PartnerMember,
  PartnerMemberRole,
  Redemption,
  RedemptionStatus,
  Role,
  User,
  UserRole,
  UserStatus,
} from "@repo/db";
import { procedure, protectedProcedure, t } from "../base/index.js";
import { z } from "zod";

@Injectable()
export class BusinessRouter {
  constructor(
    @InjectRepository(Partner)
    private readonly partnersRepo: Repository<Partner>,
    @InjectRepository(PartnerMember)
    private readonly partnerMembersRepo: Repository<PartnerMember>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
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

  private async getOrCreateCurrentUser(ctx: {
    auth: {
      userId: string | null;
      user?: {
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
      } | null;
    };
  }): Promise<User> {
    if (!ctx.auth.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authenticated Clerk user ID is missing",
      });
    }

    const existing = await this.usersRepo.findOne({
      where: { clerkUserId: ctx.auth.userId },
    });

    if (existing) {
      return existing;
    }

    const email =
      ctx.auth.user?.email?.trim().toLowerCase() ??
      `${ctx.auth.userId}@clerk.local`;

    const userWithEmail = await this.usersRepo.findOne({
      where: { email },
    });

    if (userWithEmail) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "A local user with this email already exists. Link the Clerk account to this user first.",
      });
    }

    const displayName = [ctx.auth.user?.firstName, ctx.auth.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const user = this.usersRepo.create({
      clerkUserId: ctx.auth.userId,
      email,
      firstName: ctx.auth.user?.firstName ?? null,
      lastName: ctx.auth.user?.lastName ?? null,
      displayName: displayName || email,
      avatarUrl: ctx.auth.user?.imageUrl ?? null,
      phone: null,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(),
    });

    return this.usersRepo.save(user);
  }

  private async getRoleCodes(userId: string): Promise<string[]> {
    const userRoles = await this.userRolesRepo.find({
      where: { userId },
      relations: { role: true },
    });

    return userRoles
      .map((userRole) => userRole.role?.code)
      .filter((code): code is string => Boolean(code));
  }

  private async getActivePartnerMembership(userId: string) {
    const memberships = await this.partnerMembersRepo.find({
      where: { userId, isActive: true },
      relations: { partner: true },
      order: { createdAt: "ASC" },
    });

    return {
      membership: memberships[0] ?? null,
      membershipsCount: memberships.length,
    };
  }

  private async requireAdminUser(ctx: {
    auth: {
      userId: string | null;
      user?: {
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
      } | null;
    };
  }): Promise<User> {
    const user = await this.getOrCreateCurrentUser(ctx);
    const roles = await this.getRoleCodes(user.id);

    if (!roles.includes("admin") && !roles.includes("super_admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access is required",
      });
    }

    return user;
  }

  private async requireMyPartner(ctx: {
    auth: {
      userId: string | null;
      user?: {
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
      } | null;
    };
  }): Promise<{
    user: User;
    partner: Partner;
    membership: PartnerMember;
  }> {
    const user = await this.getOrCreateCurrentUser(ctx);
    const { membership, membershipsCount } =
      await this.getActivePartnerMembership(user.id);

    if (!membership || !membership.partner) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Current user is not assigned to a partner",
      });
    }

    if (membershipsCount > 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Current user has multiple active partner memberships. This project allows only one active partner per business user.",
      });
    }

    if (membership.memberRole === PartnerMemberRole.STAFF) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Staff users must use the staff mobile app",
      });
    }

    if (membership.partner.status === PartnerStatus.PENDING) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Partner application is still pending approval",
      });
    }

    if (membership.partner.status === PartnerStatus.REJECTED) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Partner application was rejected",
      });
    }

    if (membership.partner.status === PartnerStatus.SUSPENDED) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Partner account is suspended",
      });
    }

    if (membership.partner.status !== PartnerStatus.APPROVED) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Partner account is not approved",
      });
    }

    return {
      user,
      partner: membership.partner,
      membership,
    };
  }

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
    auth: t.router({
      getMe: protectedProcedure.query(async ({ ctx }) => {
        const user = await this.getOrCreateCurrentUser(ctx);
        const roles = await this.getRoleCodes(user.id);
        const { membership, membershipsCount } =
          await this.getActivePartnerMembership(user.id);

        const partner = membership?.partner ?? null;
        const isAdmin =
          roles.includes("admin") || roles.includes("super_admin");

        let businessAccess:
          | "admin"
          | "partner"
          | "partner_pending"
          | "partner_rejected"
          | "partner_suspended"
          | "staff_mobile_only"
          | "no_access" = "no_access";

        if (isAdmin) {
          businessAccess = "admin";
        } else if (membership && partner) {
          if (membership.memberRole === PartnerMemberRole.STAFF) {
            businessAccess = "staff_mobile_only";
          } else if (partner.status === PartnerStatus.APPROVED) {
            businessAccess = "partner";
          } else if (partner.status === PartnerStatus.PENDING) {
            businessAccess = "partner_pending";
          } else if (partner.status === PartnerStatus.REJECTED) {
            businessAccess = "partner_rejected";
          } else if (partner.status === PartnerStatus.SUSPENDED) {
            businessAccess = "partner_suspended";
          }
        }

        return {
          user: {
            id: user.id,
            clerkUserId: user.clerkUserId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            status: user.status,
          },
          roles,
          isAdmin,
          businessAccess,
          membership: membership
            ? {
                id: membership.id,
                role: membership.memberRole,
                isActive: membership.isActive,
                partnerId: membership.partnerId,
              }
            : null,
          partner: partner
            ? {
                id: partner.id,
                brandName: partner.brandName,
                legalName: partner.legalName,
                status: partner.status,
                rejectionReason: partner.rejectionReason,
                contactEmail: partner.contactEmail,
              }
            : null,
          warnings: {
            multipleActivePartnerMemberships: membershipsCount > 1,
          },
        };
      }),
    }),

    partner: t.router({
      submitApplication: protectedProcedure
        .input(
          z.object({
            legalName: z.string().trim().min(2).max(255),
            brandName: z.string().trim().min(2).max(255),
            description: z.string().trim().max(2000).optional(),
            contactEmail: z.string().email(),
            contactPhone: z.string().trim().max(30).optional(),
            websiteUrl: z.string().url().optional(),
            instagramUrl: z.string().url().optional(),
            logoUrl: z.string().url().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const user = await this.getOrCreateCurrentUser(ctx);
          const { membership } = await this.getActivePartnerMembership(user.id);

          if (membership) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "User is already assigned to a partner",
            });
          }

          const partner = this.partnersRepo.create({
            legalName: input.legalName,
            brandName: input.brandName,
            description: input.description ?? null,
            contactEmail: input.contactEmail,
            contactPhone: input.contactPhone ?? null,
            websiteUrl: input.websiteUrl ?? null,
            instagramUrl: input.instagramUrl ?? null,
            logoUrl: input.logoUrl ?? null,
            status: PartnerStatus.PENDING,
            createdByUserId: user.id,
            approvedByUserId: null,
            approvedAt: null,
            rejectionReason: null,
          });

          const savedPartner = await this.partnersRepo.save(partner);

          const partnerMember = this.partnerMembersRepo.create({
            partnerId: savedPartner.id,
            userId: user.id,
            memberRole: PartnerMemberRole.OWNER,
            isActive: true,
          });

          await this.partnerMembersRepo.save(partnerMember);

          return {
            partner: {
              id: savedPartner.id,
              legalName: savedPartner.legalName,
              brandName: savedPartner.brandName,
              status: savedPartner.status,
              contactEmail: savedPartner.contactEmail,
            },
            membership: {
              role: partnerMember.memberRole,
              isActive: partnerMember.isActive,
            },
          };
        }),

      getDashboard: protectedProcedure.query(async ({ ctx }) => {
        const { partner } = await this.requireMyPartner(ctx);
        return this.buildPartnerSummary(partner);
      }),

      listStaffMembers: protectedProcedure.query(async ({ ctx }) => {
        const { partner } = await this.requireMyPartner(ctx);

        const members = await this.partnerMembersRepo.find({
          where: { partnerId: partner.id },
          relations: { user: true },
          order: { createdAt: "ASC" },
        });

        return {
          partner: {
            id: partner.id,
            brandName: partner.brandName,
            status: partner.status,
          },
          items: members.map((member) => ({
            id: member.id,
            partnerId: member.partnerId,
            userId: member.userId,
            role: member.memberRole,
            isActive: member.isActive,
            createdAt: member.createdAt,
            user: member.user
              ? {
                  id: member.user.id,
                  email: member.user.email,
                  firstName: member.user.firstName,
                  lastName: member.user.lastName,
                  displayName: member.user.displayName,
                  status: member.user.status,
                }
              : null,
          })),
        };
      }),

      addStaffMember: protectedProcedure
        .input(
          z.object({
            email: z.string().email(),
            role: z.enum(["manager", "staff", "analyst"]).default("staff"),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const { partner, membership } = await this.requireMyPartner(ctx);

          if (
            membership.memberRole !== PartnerMemberRole.OWNER &&
            membership.memberRole !== PartnerMemberRole.MANAGER
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Only partner owner or manager can add staff members",
            });
          }

          const normalizedEmail = input.email.trim().toLowerCase();

          const user = await this.usersRepo.findOne({
            where: { email: normalizedEmail },
          });

          if (!user) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "User not found. The staff user must sign in once before they can be added.",
            });
          }

          const activeMemberships = await this.partnerMembersRepo.find({
            where: { userId: user.id, isActive: true },
          });

          const activeOtherPartner = activeMemberships.find(
            (item) => item.partnerId !== partner.id
          );

          if (activeOtherPartner) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "User is already assigned to another partner",
            });
          }

          const existingMembership = await this.partnerMembersRepo.findOne({
            where: { partnerId: partner.id, userId: user.id },
          });

          if (existingMembership) {
            existingMembership.memberRole = input.role as PartnerMemberRole;
            existingMembership.isActive = true;

            const saved = await this.partnerMembersRepo.save(existingMembership);

            return {
              id: saved.id,
              role: saved.memberRole,
              isActive: saved.isActive,
              user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
              },
            };
          }

          const member = this.partnerMembersRepo.create({
            partnerId: partner.id,
            userId: user.id,
            memberRole: input.role as PartnerMemberRole,
            isActive: true,
          });

          const saved = await this.partnerMembersRepo.save(member);

          return {
            id: saved.id,
            role: saved.memberRole,
            isActive: saved.isActive,
            user: {
              id: user.id,
              email: user.email,
              displayName: user.displayName,
            },
          };
        }),

      updateStaffMemberRole: protectedProcedure
        .input(
          z.object({
            memberId: z.string().uuid(),
            role: z.enum(["manager", "staff", "analyst"]),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const { partner, membership } = await this.requireMyPartner(ctx);

          if (
            membership.memberRole !== PartnerMemberRole.OWNER &&
            membership.memberRole !== PartnerMemberRole.MANAGER
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Only partner owner or manager can update staff roles",
            });
          }

          const member = await this.partnerMembersRepo.findOne({
            where: { id: input.memberId, partnerId: partner.id },
            relations: { user: true },
          });

          if (!member) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Partner member not found",
            });
          }

          if (member.memberRole === PartnerMemberRole.OWNER) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Owner role cannot be changed from this screen",
            });
          }

          member.memberRole = input.role as PartnerMemberRole;

          const saved = await this.partnerMembersRepo.save(member);

          return {
            id: saved.id,
            role: saved.memberRole,
            isActive: saved.isActive,
            user: saved.user
              ? {
                  id: saved.user.id,
                  email: saved.user.email,
                  displayName: saved.user.displayName,
                }
              : null,
          };
        }),

      deactivateStaffMember: protectedProcedure
        .input(z.object({ memberId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
          const { partner, membership } = await this.requireMyPartner(ctx);

          if (
            membership.memberRole !== PartnerMemberRole.OWNER &&
            membership.memberRole !== PartnerMemberRole.MANAGER
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Only partner owner or manager can deactivate staff members",
            });
          }

          const member = await this.partnerMembersRepo.findOne({
            where: { id: input.memberId, partnerId: partner.id },
            relations: { user: true },
          });

          if (!member) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Partner member not found",
            });
          }

          if (member.memberRole === PartnerMemberRole.OWNER) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Owner cannot be deactivated from this screen",
            });
          }

          member.isActive = false;

          const saved = await this.partnerMembersRepo.save(member);

          return {
            id: saved.id,
            role: saved.memberRole,
            isActive: saved.isActive,
            user: saved.user
              ? {
                  id: saved.user.id,
                  email: saved.user.email,
                  displayName: saved.user.displayName,
                }
              : null,
          };
        }),

      listLocations: protectedProcedure.query(async ({ ctx }) => {
        const { partner } = await this.requireMyPartner(ctx);

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

      createLocation: protectedProcedure
        .input(
          z.object({
            name: z.string().trim().min(2).max(255),
            city: z.string().trim().max(100).optional(),
            address: z.string().trim().min(5),
            latitude: z.number().min(-90).max(90).optional(),
            longitude: z.number().min(-180).max(180).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const { partner } = await this.requireMyPartner(ctx);

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

      createOffer: protectedProcedure
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
        .mutation(async ({ ctx, input }) => {
          const { partner } = await this.requireMyPartner(ctx);

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

      listOffers: protectedProcedure
        .input(
          z
            .object({
              limit: z.number().int().min(1).max(100).default(50),
              offset: z.number().int().min(0).default(0),
            })
            .optional()
        )
        .query(async ({ ctx, input }) => {
          const { partner } = await this.requireMyPartner(ctx);

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

      listRedemptions: protectedProcedure
        .input(
          z
            .object({
              limit: z.number().int().min(1).max(100).default(50),
              offset: z.number().int().min(0).default(0),
            })
            .optional()
        )
        .query(async ({ ctx, input }) => {
          const { partner } = await this.requireMyPartner(ctx);

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

      getAnalytics: protectedProcedure.query(async ({ ctx }) => {
        const { partner } = await this.requireMyPartner(ctx);
        const summary = await this.buildPartnerSummary(partner);

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
      listPartners: protectedProcedure
        .input(
          z
            .object({
              status: z
                .enum(["pending", "approved", "rejected", "suspended", "archived"])
                .optional(),
              limit: z.number().int().min(1).max(100).default(100),
              offset: z.number().int().min(0).default(0),
            })
            .optional()
        )
        .query(async ({ ctx, input }) => {
          await this.requireAdminUser(ctx);

          const where = input?.status
            ? { status: input.status as PartnerStatus }
            : {};

          const [items, total] = await this.partnersRepo.findAndCount({
            where,
            order: { createdAt: "DESC" },
            take: input?.limit ?? 100,
            skip: input?.offset ?? 0,
          });

          const ownerMemberships = await this.partnerMembersRepo.find({
            where: {
              partnerId: In(items.map((partner) => partner.id)),
              memberRole: PartnerMemberRole.OWNER,
            },
            relations: { user: true },
          });

          const ownerByPartnerId = new Map(
            ownerMemberships.map((membership) => [
              membership.partnerId,
              membership.user,
            ])
          );

          return {
            total,
            items: items.map((partner) => {
              const owner = ownerByPartnerId.get(partner.id) ?? null;

              return {
                id: partner.id,
                legalName: partner.legalName,
                brandName: partner.brandName,
                description: partner.description,
                contactEmail: partner.contactEmail,
                contactPhone: partner.contactPhone,
                websiteUrl: partner.websiteUrl,
                instagramUrl: partner.instagramUrl,
                logoUrl: partner.logoUrl,
                status: partner.status,
                approvedAt: partner.approvedAt,
                rejectionReason: partner.rejectionReason,
                createdAt: partner.createdAt,
                owner: owner
                  ? {
                      id: owner.id,
                      email: owner.email,
                      displayName: owner.displayName,
                    }
                  : null,
              };
            }),
          };
        }),

      approvePartner: protectedProcedure
        .input(z.object({ partnerId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
          const adminUser = await this.requireAdminUser(ctx);

          const partner = await this.partnersRepo.findOne({
            where: { id: input.partnerId },
          });

          if (!partner) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Partner not found",
            });
          }

          partner.status = PartnerStatus.APPROVED;
          partner.approvedAt = new Date();
          partner.approvedByUserId = adminUser.id;
          partner.rejectionReason = null;

          const saved = await this.partnersRepo.save(partner);

          return {
            id: saved.id,
            brandName: saved.brandName,
            legalName: saved.legalName,
            status: saved.status,
            approvedAt: saved.approvedAt,
          };
        }),

      rejectPartner: protectedProcedure
        .input(
          z.object({
            partnerId: z.string().uuid(),
            reason: z.string().trim().min(2).max(1000).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await this.requireAdminUser(ctx);

          const partner = await this.partnersRepo.findOne({
            where: { id: input.partnerId },
          });

          if (!partner) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Partner not found",
            });
          }

          partner.status = PartnerStatus.REJECTED;
          partner.approvedAt = null;
          partner.rejectionReason = input.reason ?? "Rejected by admin";

          const saved = await this.partnersRepo.save(partner);

          return {
            id: saved.id,
            brandName: saved.brandName,
            legalName: saved.legalName,
            status: saved.status,
            rejectionReason: saved.rejectionReason,
          };
        }),

      suspendPartner: protectedProcedure
        .input(z.object({ partnerId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
          await this.requireAdminUser(ctx);

          const partner = await this.partnersRepo.findOne({
            where: { id: input.partnerId },
          });

          if (!partner) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Partner not found",
            });
          }

          partner.status = PartnerStatus.SUSPENDED;
          partner.approvedAt = null;

          const saved = await this.partnersRepo.save(partner);

          return {
            id: saved.id,
            brandName: saved.brandName,
            legalName: saved.legalName,
            status: saved.status,
          };
        }),

      listOffers: protectedProcedure
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
        .query(async ({ ctx, input }) => {
          await this.requireAdminUser(ctx);

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

      approveOffer: protectedProcedure
        .input(z.object({ offerId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
          await this.requireAdminUser(ctx);

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

      publishOffer: protectedProcedure
        .input(z.object({ offerId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
          await this.requireAdminUser(ctx);

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

      rejectOffer: protectedProcedure
        .input(z.object({ offerId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
          await this.requireAdminUser(ctx);

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

      archiveOffer: protectedProcedure
        .input(z.object({ offerId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
          await this.requireAdminUser(ctx);

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

      getDashboard: protectedProcedure.query(async ({ ctx }) => {
        await this.requireAdminUser(ctx);

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

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { Repository } from "typeorm";
import {
  PartnerMember,
  PartnerMemberRole,
  User,
  UserRole,
} from "@repo/db";
import { RedemptionsService } from "@repo/domain-services";
import { protectedProcedure, t } from "../base/index.js";
import { z } from "zod";

@Injectable()
export class RedemptionsRouter {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(PartnerMember)
    private readonly partnerMembersRepo: Repository<PartnerMember>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
    private readonly redemptionsService: RedemptionsService
  ) {}

  private async findLocalUserByClerkId(clerkUserId: string) {
    return this.usersRepo.findOne({
      where: { clerkUserId },
    });
  }

  private async getRoleCodesByLocalUserId(userId: string): Promise<string[]> {
    const userRoles = await this.userRolesRepo.find({
      where: { userId },
      relations: { role: true },
    });

    return userRoles
      .map((userRole) => userRole.role?.code)
      .filter((code): code is string => Boolean(code));
  }

  private async requireQrOperator(ctx: {
    auth: {
      userId: string | null;
    };
  }): Promise<User> {
    if (!ctx.auth.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authenticated Clerk user ID is missing",
      });
    }

    const user = await this.findLocalUserByClerkId(ctx.auth.userId);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Application user not found for current Clerk account",
      });
    }

    const roleCodes = await this.getRoleCodesByLocalUserId(user.id);

    if (roleCodes.includes("admin") || roleCodes.includes("super_admin")) {
      return user;
    }

    const activePartnerMemberships = await this.partnerMembersRepo.find({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    const canOperateQr = activePartnerMemberships.some((membership) =>
      [
        PartnerMemberRole.OWNER,
        PartnerMemberRole.MANAGER,
        PartnerMemberRole.STAFF,
      ].includes(membership.memberRole)
    );

    if (!canOperateQr) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Partner staff or admin access is required for QR operations",
      });
    }

    return user;
  }

  public readonly router = t.router({
    create: protectedProcedure
      .input(
        z.object({
          offerId: z.string().uuid(),
          locationId: z.string().uuid().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.auth.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authenticated Clerk user ID is missing",
          });
        }

        const user = await this.findLocalUserByClerkId(ctx.auth.userId);

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application user not found for current Clerk account",
          });
        }

        try {
          return await this.redemptionsService.createRedemption({
            userId: user.id,
            offerId: input.offerId,
            locationId: input.locationId,
          });
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("not found")) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: error.message,
              });
            }

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create redemption",
          });
        }
      }),

    listMine: protectedProcedure
      .input(
        z
          .object({
            limit: z.number().int().min(1).max(100).default(20),
            offset: z.number().int().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.auth.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authenticated Clerk user ID is missing",
          });
        }

        const user = await this.findLocalUserByClerkId(ctx.auth.userId);

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application user not found for current Clerk account",
          });
        }

        return this.redemptionsService.listUserRedemptions(
          user.id,
          input?.limit ?? 20,
          input?.offset ?? 0
        );
      }),

    getMineById: protectedProcedure
      .input(
        z.object({
          redemptionId: z.string().uuid(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.auth.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authenticated Clerk user ID is missing",
          });
        }

        const user = await this.findLocalUserByClerkId(ctx.auth.userId);

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application user not found for current Clerk account",
          });
        }

        try {
          return await this.redemptionsService.getUserRedemptionById(
            user.id,
            input.redemptionId
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
              error instanceof Error
                ? error.message
                : "Failed to load redemption",
          });
        }
      }),

    validateByQrToken: protectedProcedure
      .input(
        z.object({
          qrToken: z.string().trim().min(1),
        })
      )
      .query(async ({ ctx, input }) => {
        await this.requireQrOperator(ctx);

        try {
          return await this.redemptionsService.validateByQrToken(input.qrToken);
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("not found")) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: error.message,
              });
            }

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to validate QR token",
          });
        }
      }),

    confirmByQrToken: protectedProcedure
      .input(
        z.object({
          qrToken: z.string().trim().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await this.requireQrOperator(ctx);

        try {
          return await this.redemptionsService.confirmByQrToken({
            qrToken: input.qrToken,
          });
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("not found")) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: error.message,
              });
            }

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to confirm QR token",
          });
        }
      }),

    cancelByQrToken: protectedProcedure
      .input(
        z.object({
          qrToken: z.string().trim().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await this.requireQrOperator(ctx);

        try {
          return await this.redemptionsService.cancelByQrToken(input.qrToken);
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("not found")) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: error.message,
              });
            }

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to cancel QR token",
          });
        }
      }),
  });
}

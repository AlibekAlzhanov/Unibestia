import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { Repository } from "typeorm";
import { User } from "@repo/db";
import { RedemptionsService } from "@repo/domain-services";
import { procedure, protectedProcedure, t } from "../base/index.js";
import { z } from "zod";

@Injectable()
export class RedemptionsRouter {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly redemptionsService: RedemptionsService
  ) {}

  private async findLocalUserByClerkId(clerkUserId: string) {
    return this.usersRepo.findOne({
      where: { clerkUserId },
    });
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

    /**
     * DEV/PANEL ONLY:
     * Public for local testing from tRPC panel.
     * Before production, change these back to protectedProcedure
     * and add partner_staff/admin role checks.
     */
    validateByQrToken: procedure
      .input(
        z.object({
          qrToken: z.string().trim().min(1),
        })
      )
      .query(async ({ input }) => {
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

    confirmByQrToken: procedure
      .input(
        z.object({
          qrToken: z.string().trim().min(1),
        })
      )
      .mutation(async ({ input }) => {
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

    cancelByQrToken: procedure
      .input(
        z.object({
          qrToken: z.string().trim().min(1),
          reason: z.string().trim().min(1).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Current RedemptionsService signature accepts only qrToken string.
          // The optional reason is accepted by the API schema for future UI use,
          // but is not persisted until the service is extended.
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

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { Repository } from "typeorm";
import { User } from "@repo/db";
import { WalletsService } from "@repo/domain-services";
import { protectedProcedure, t } from "../base/index.js";
import { z } from "zod";

@Injectable()
export class WalletRouter {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly walletsService: WalletsService
  ) {}

  private async findLocalUserByClerkId(clerkUserId: string) {
    return this.usersRepo.findOne({
      where: { clerkUserId },
    });
  }

  public readonly router = t.router({
    getMyWallet: protectedProcedure.query(async ({ ctx }) => {
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

      return this.walletsService.getWalletByUserId(user.id);
    }),

    getMyTransactions: protectedProcedure
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

        return this.walletsService.getWalletTransactionsByUserId(
          user.id,
          input?.limit ?? 20,
          input?.offset ?? 0
        );
      }),
  });
}

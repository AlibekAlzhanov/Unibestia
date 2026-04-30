import { Inject, Injectable } from "@nestjs/common";
import { WalletTransactionSourceType } from "@repo/db";
import { WalletsRepository } from "../repositories/wallets.repository.js";

export type EarnRedemptionRewardInput = {
  userId: string;
  redemptionId: string;
  points: number;
  offerTitle?: string | null;
};

@Injectable()
export class WalletsService {
  constructor(
    @Inject(WalletsRepository)
    private readonly walletsRepository: WalletsRepository
  ) {}

  async getWalletByUserId(userId: string) {
    const wallet = await this.walletsRepository.findOrCreateWalletByUserId(
      userId
    );

    return {
      id: wallet.id,
      userId: wallet.userId,
      availableBalance: wallet.availableBalance,
      lifetimeEarned: wallet.lifetimeEarned,
      lifetimeSpent: wallet.lifetimeSpent,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  async getWalletTransactionsByUserId(
    userId: string,
    limit: number,
    offset: number
  ) {
    await this.walletsRepository.findOrCreateWalletByUserId(userId);

    const [items, total] =
      await this.walletsRepository.listWalletTransactionsByUserId(
        userId,
        limit,
        offset
      );

    return {
      total,
      limit,
      offset,
      items: items.map((item) => ({
        id: item.id,
        walletId: item.walletId,
        userId: item.userId,
        type: item.type,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        pointsDelta: item.pointsDelta,
        balanceAfter: item.balanceAfter,
        expiresAt: item.expiresAt,
        comment: item.comment,
        createdAt: item.createdAt,
      })),
    };
  }

  async earnRedemptionReward(input: EarnRedemptionRewardInput) {
    const points = Math.floor(input.points);

    if (points <= 0) {
      return {
        applied: false,
        alreadyApplied: false,
        points: 0,
        transaction: null,
      };
    }

    const result = await this.walletsRepository.creditWallet({
      userId: input.userId,
      sourceType: WalletTransactionSourceType.REDEMPTION,
      sourceId: input.redemptionId,
      points,
      comment: input.offerTitle
        ? `Reward for redemption: ${input.offerTitle}`
        : "Reward for redemption",
      expiresAt: null,
    });

    return {
      applied: Boolean(result.transaction) && !result.alreadyApplied,
      alreadyApplied: result.alreadyApplied,
      points,
      transaction: result.transaction
        ? {
            id: result.transaction.id,
            pointsDelta: result.transaction.pointsDelta,
            balanceAfter: result.transaction.balanceAfter,
            createdAt: result.transaction.createdAt,
          }
        : null,
    };
  }
}
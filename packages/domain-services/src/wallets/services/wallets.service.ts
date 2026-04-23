import { Injectable } from "@nestjs/common";
import { WalletsRepository } from "../repositories/wallets.repository.js";

@Injectable()
export class WalletsService {
  constructor(private readonly walletsRepository: WalletsRepository) {}

  async getWalletByUserId(userId: string) {
    const wallet = await this.walletsRepository.findOrCreateWalletByUserId(userId);

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

    const [items, total] = await this.walletsRepository.listWalletTransactionsByUserId(
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
}

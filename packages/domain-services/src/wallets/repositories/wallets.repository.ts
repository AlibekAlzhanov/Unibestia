import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Wallet, WalletTransaction } from "@repo/db";

@Injectable()
export class WalletsRepository {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletsRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionsRepo: Repository<WalletTransaction>
  ) {}

  async findWalletByUserId(userId: string): Promise<Wallet | null> {
    return this.walletsRepo.findOne({
      where: { userId },
    });
  }

  async createWalletForUser(userId: string): Promise<Wallet> {
    const wallet = this.walletsRepo.create({
      userId,
      availableBalance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
    });

    return this.walletsRepo.save(wallet);
  }

  async findOrCreateWalletByUserId(userId: string): Promise<Wallet> {
    const existing = await this.findWalletByUserId(userId);

    if (existing) {
      return existing;
    }

    return this.createWalletForUser(userId);
  }

  async listWalletTransactionsByUserId(
    userId: string,
    limit: number,
    offset: number
  ): Promise<[WalletTransaction[], number]> {
    return this.walletTransactionsRepo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });
  }
}

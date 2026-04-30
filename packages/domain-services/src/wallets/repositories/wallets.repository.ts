import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  Wallet,
  WalletTransaction,
  WalletTransactionSourceType,
  WalletTransactionType,
} from "@repo/db";

export type CreditWalletInput = {
  userId: string;
  sourceType: WalletTransactionSourceType;
  sourceId: string;
  points: number;
  comment?: string | null;
  expiresAt?: Date | null;
};

@Injectable()
export class WalletsRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

  async findTransactionBySource(input: {
    userId: string;
    sourceType: WalletTransactionSourceType;
    sourceId: string;
    type?: WalletTransactionType;
  }): Promise<WalletTransaction | null> {
    return this.walletTransactionsRepo.findOne({
      where: {
        userId: input.userId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        ...(input.type ? { type: input.type } : {}),
      },
    });
  }

  async creditWallet(input: CreditWalletInput): Promise<{
    wallet: Wallet;
    transaction: WalletTransaction | null;
    alreadyApplied: boolean;
  }> {
    const points = Math.floor(input.points);

    if (points <= 0) {
      const wallet = await this.findOrCreateWalletByUserId(input.userId);

      return {
        wallet,
        transaction: null,
        alreadyApplied: false,
      };
    }

    const existingTransaction = await this.findTransactionBySource({
      userId: input.userId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      type: WalletTransactionType.EARN,
    });

    if (existingTransaction) {
      const wallet = await this.findOrCreateWalletByUserId(input.userId);

      return {
        wallet,
        transaction: existingTransaction,
        alreadyApplied: true,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const transactionRepo = manager.getRepository(WalletTransaction);

      let wallet = await walletRepo.findOne({
        where: { userId: input.userId },
        lock: { mode: "pessimistic_write" },
      });

      if (!wallet) {
        wallet = walletRepo.create({
          userId: input.userId,
          availableBalance: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
        });

        wallet = await walletRepo.save(wallet);
      }

      const duplicate = await transactionRepo.findOne({
        where: {
          userId: input.userId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          type: WalletTransactionType.EARN,
        },
      });

      if (duplicate) {
        return {
          wallet,
          transaction: duplicate,
          alreadyApplied: true,
        };
      }

      const nextBalance = wallet.availableBalance + points;

      wallet.availableBalance = nextBalance;
      wallet.lifetimeEarned += points;

      const savedWallet = await walletRepo.save(wallet);

      const transaction = transactionRepo.create({
        walletId: savedWallet.id,
        userId: input.userId,
        type: WalletTransactionType.EARN,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        pointsDelta: points,
        balanceAfter: nextBalance,
        expiresAt: input.expiresAt ?? null,
        comment: input.comment ?? null,
      });

      const savedTransaction = await transactionRepo.save(transaction);

      return {
        wallet: savedWallet,
        transaction: savedTransaction,
        alreadyApplied: false,
      };
    });
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
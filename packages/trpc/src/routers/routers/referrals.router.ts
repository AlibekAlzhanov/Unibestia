import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import { DataSource, EntityManager, Repository } from "typeorm";
import { z } from "zod";
import {
  Notification,
  NotificationChannel,
  NotificationType,
  ReferralCode,
  ReferralReward,
  ReferralRewardStatus,
  StudentProfile,
  StudentVerificationStatus,
  User,
  UserStatus,
  Wallet,
  WalletTransaction,
  WalletTransactionSourceType,
  WalletTransactionType,
} from "@repo/db";
import { protectedProcedure, t } from "../base/index.js";

type AuthContextLike = {
  auth: {
    userId: string | null;
    user?: {
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    } | null;
  };
};

const REFERRER_REWARD_POINTS = 100;
const REFERRED_REWARD_POINTS = 50;

@Injectable()
export class ReferralsRouter {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentProfilesRepo: Repository<StudentProfile>,
    @InjectRepository(ReferralCode)
    private readonly referralCodesRepo: Repository<ReferralCode>,
    @InjectRepository(ReferralReward)
    private readonly referralRewardsRepo: Repository<ReferralReward>,
    @InjectRepository(Wallet)
    private readonly walletsRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionsRepo: Repository<WalletTransaction>,
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  private async findLocalUserByClerkId(clerkUserId: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { clerkUserId },
    });
  }

  private async getOrCreateCurrentUser(ctx: AuthContextLike): Promise<User> {
    if (!ctx.auth.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authenticated Clerk user ID is missing",
      });
    }

    const existing = await this.findLocalUserByClerkId(ctx.auth.userId);

    if (existing) {
      existing.lastLoginAt = new Date();
      return this.usersRepo.save(existing);
    }

    const clerkEmail = ctx.auth.user?.email
      ? this.normalizeEmail(ctx.auth.user.email)
      : null;

    if (!clerkEmail) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Clerk email is required to create local user",
      });
    }

    const existingByEmail = await this.usersRepo.findOne({
      where: { email: clerkEmail },
    });

    if (existingByEmail) {
      existingByEmail.clerkUserId = ctx.auth.userId;
      existingByEmail.lastLoginAt = new Date();
      return this.usersRepo.save(existingByEmail);
    }

    const displayName = [ctx.auth.user?.firstName, ctx.auth.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const user = this.usersRepo.create({
      clerkUserId: ctx.auth.userId,
      email: clerkEmail,
      firstName: ctx.auth.user?.firstName ?? null,
      lastName: ctx.auth.user?.lastName ?? null,
      displayName: displayName || clerkEmail,
      avatarUrl: ctx.auth.user?.imageUrl ?? null,
      phone: null,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(),
    });

    return this.usersRepo.save(user);
  }

  private buildReferralCodeSeed(user: User): string {
    const base = (
      user.firstName ||
      user.displayName ||
      user.email.split("@")[0] ||
      "UNI"
    )
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);

    return base || "UNI";
  }

  private async generateUniqueReferralCode(user: User): Promise<string> {
    const seed = this.buildReferralCodeSeed(user);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const suffix = randomBytes(3).toString("hex").toUpperCase();
      const code = `${seed}${suffix}`.slice(0, 14);

      const existing = await this.referralCodesRepo.findOne({
        where: { code },
      });

      if (!existing) {
        return code;
      }
    }

    return `UNI${randomBytes(5).toString("hex").toUpperCase()}`;
  }

  private async findOrCreateReferralCode(user: User): Promise<ReferralCode> {
    const existing = await this.referralCodesRepo.findOne({
      where: { userId: user.id },
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        return this.referralCodesRepo.save(existing);
      }

      return existing;
    }

    const code = await this.generateUniqueReferralCode(user);

    const created = this.referralCodesRepo.create({
      userId: user.id,
      code,
      isActive: true,
    });

    return this.referralCodesRepo.save(created);
  }

  private async getReferralCodeOwner(code: string): Promise<ReferralCode> {
    const normalizedCode = this.normalizeCode(code);

    if (normalizedCode.length < 4) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Referral code is too short",
      });
    }

    const referralCode = await this.referralCodesRepo.findOne({
      where: {
        code: normalizedCode,
        isActive: true,
      },
      relations: {
        user: true,
      },
    });

    if (!referralCode) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Referral code not found or inactive",
      });
    }

    return referralCode;
  }

  private async isStudentVerified(userId: string): Promise<boolean> {
    const profile = await this.studentProfilesRepo.findOne({
      where: { userId },
    });

    return profile?.verificationStatus === StudentVerificationStatus.VERIFIED;
  }

  private async insertWalletIfMissing(
    manager: EntityManager,
    userId: string
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(Wallet)
      .values({
        userId,
        availableBalance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
      })
      .orIgnore()
      .execute();
  }

  private async creditReferralWallet(input: {
    manager: EntityManager;
    userId: string;
    sourceId: string;
    points: number;
    comment: string;
  }): Promise<WalletTransaction | null> {
    if (input.points <= 0) {
      return null;
    }

    const walletRepo = input.manager.getRepository(Wallet);
    const transactionRepo = input.manager.getRepository(WalletTransaction);

    const existingTransaction = await transactionRepo.findOne({
      where: {
        userId: input.userId,
        sourceType: WalletTransactionSourceType.REFERRAL,
        sourceId: input.sourceId,
        type: WalletTransactionType.EARN,
      },
    });

    if (existingTransaction) {
      return existingTransaction;
    }

    await this.insertWalletIfMissing(input.manager, input.userId);

    const wallet = await walletRepo.findOne({
      where: { userId: input.userId },
      lock: { mode: "pessimistic_write" },
    });

    if (!wallet) {
      throw new Error("Failed to create or lock wallet");
    }

    const nextBalance = wallet.availableBalance + input.points;

    wallet.availableBalance = nextBalance;
    wallet.lifetimeEarned += input.points;

    const savedWallet = await walletRepo.save(wallet);

    const transaction = transactionRepo.create({
      walletId: savedWallet.id,
      userId: input.userId,
      type: WalletTransactionType.EARN,
      sourceType: WalletTransactionSourceType.REFERRAL,
      sourceId: input.sourceId,
      pointsDelta: input.points,
      balanceAfter: nextBalance,
      expiresAt: null,
      comment: input.comment,
    });

    return transactionRepo.save(transaction);
  }

  private async createNotification(input: {
    manager: EntityManager;
    userId: string;
    title: string;
    body: string;
    relatedEntityId?: string | null;
  }): Promise<void> {
    const notificationRepo = input.manager.getRepository(Notification);

    const notification = notificationRepo.create({
      userId: input.userId,
      type: NotificationType.REFERRAL_REWARD,
      channel: NotificationChannel.IN_APP,
      title: input.title,
      body: input.body,
      isRead: false,
      relatedEntityType: "referral_reward",
      relatedEntityId: input.relatedEntityId ?? null,
      sentAt: new Date(),
      readAt: null,
    });

    await notificationRepo.save(notification);
  }

  private async rewardReferralIfVerified(
    rewardId: string
  ): Promise<ReferralReward> {
    return this.dataSource.transaction(async (manager) => {
      const rewardRepo = manager.getRepository(ReferralReward);

      const reward = await rewardRepo.findOne({
        where: { id: rewardId },
        lock: { mode: "pessimistic_write" },
      });

      if (!reward) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Referral reward not found",
        });
      }

      if (reward.status === ReferralRewardStatus.REWARDED) {
        return reward;
      }

      if (reward.status === ReferralRewardStatus.CANCELLED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cancelled referral reward cannot be claimed",
        });
      }

      const referredIsVerified = await this.isStudentVerified(
        reward.referredUserId
      );

      if (!referredIsVerified) {
        reward.status = ReferralRewardStatus.REGISTERED;
        return rewardRepo.save(reward);
      }

      await this.creditReferralWallet({
        manager,
        userId: reward.referrerUserId,
        sourceId: reward.id,
        points: reward.referrerRewardPoints,
        comment: "Referral reward: invited student verified",
      });

      await this.creditReferralWallet({
        manager,
        userId: reward.referredUserId,
        sourceId: reward.id,
        points: reward.referredRewardPoints,
        comment: "Referral reward: student verification bonus",
      });

      reward.status = ReferralRewardStatus.REWARDED;
      reward.rewardedAt = new Date();

      const savedReward = await rewardRepo.save(reward);

      await this.createNotification({
        manager,
        userId: savedReward.referrerUserId,
        title: "Реферальный бонус начислен",
        body: `Вы получили ${savedReward.referrerRewardPoints} бонусов за приглашённого студента.`,
        relatedEntityId: savedReward.id,
      });

      await this.createNotification({
        manager,
        userId: savedReward.referredUserId,
        title: "Бонус за регистрацию начислен",
        body: `Вы получили ${savedReward.referredRewardPoints} бонусов за использование referral code.`,
        relatedEntityId: savedReward.id,
      });

      return savedReward;
    });
  }

  private serializeReward(reward: ReferralReward) {
    return {
      id: reward.id,
      referrerUserId: reward.referrerUserId,
      referredUserId: reward.referredUserId,
      referralCodeId: reward.referralCodeId,
      status: reward.status,
      referrerRewardPoints: reward.referrerRewardPoints,
      referredRewardPoints: reward.referredRewardPoints,
      rewardedAt: reward.rewardedAt,
      createdAt: reward.createdAt,
    };
  }

  public readonly router = t.router({
    getMyReferralSummary: protectedProcedure.query(async ({ ctx }) => {
      const user = await this.getOrCreateCurrentUser(ctx);
      const referralCode = await this.findOrCreateReferralCode(user);

      const [rewardsAsReferrer, rewardsAsReferred, wallet] = await Promise.all([
        this.referralRewardsRepo.find({
          where: { referrerUserId: user.id },
          order: { createdAt: "DESC" },
          relations: {
            referredUser: true,
          },
        }),
        this.referralRewardsRepo.find({
          where: { referredUserId: user.id },
          order: { createdAt: "DESC" },
          relations: {
            referrerUser: true,
            referralCode: true,
          },
        }),
        this.walletsRepo.findOne({
          where: { userId: user.id },
        }),
      ]);

      const invitedCount = rewardsAsReferrer.length;
      const rewardedCount = rewardsAsReferrer.filter(
        (reward) => reward.status === ReferralRewardStatus.REWARDED
      ).length;

      const pendingCount = rewardsAsReferrer.filter(
        (reward) => reward.status !== ReferralRewardStatus.REWARDED
      ).length;

      const earnedPoints = rewardsAsReferrer
        .filter((reward) => reward.status === ReferralRewardStatus.REWARDED)
        .reduce((sum, reward) => sum + reward.referrerRewardPoints, 0);

      const myAppliedReferral = rewardsAsReferred[0] ?? null;

      return {
        referralCode: {
          id: referralCode.id,
          code: referralCode.code,
          isActive: referralCode.isActive,
          createdAt: referralCode.createdAt,
        },
        stats: {
          invitedCount,
          rewardedCount,
          pendingCount,
          earnedPoints,
          availableBalance: wallet?.availableBalance ?? 0,
        },
        rewardsAsReferrer: rewardsAsReferrer.map((reward) => ({
          ...this.serializeReward(reward),
          referredUser: reward.referredUser
            ? {
                id: reward.referredUser.id,
                email: reward.referredUser.email,
                displayName: reward.referredUser.displayName,
                firstName: reward.referredUser.firstName,
                lastName: reward.referredUser.lastName,
              }
            : null,
        })),
        myAppliedReferral: myAppliedReferral
          ? {
              ...this.serializeReward(myAppliedReferral),
              referrerUser: myAppliedReferral.referrerUser
                ? {
                    id: myAppliedReferral.referrerUser.id,
                    email: myAppliedReferral.referrerUser.email,
                    displayName: myAppliedReferral.referrerUser.displayName,
                    firstName: myAppliedReferral.referrerUser.firstName,
                    lastName: myAppliedReferral.referrerUser.lastName,
                  }
                : null,
              referralCode: myAppliedReferral.referralCode
                ? {
                    id: myAppliedReferral.referralCode.id,
                    code: myAppliedReferral.referralCode.code,
                  }
                : null,
            }
          : null,
      };
    }),

    applyReferralCode: protectedProcedure
      .input(
        z.object({
          code: z.string().trim().min(4).max(50),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await this.getOrCreateCurrentUser(ctx);
        const referralCode = await this.getReferralCodeOwner(input.code);

        if (referralCode.userId === user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot apply your own referral code",
          });
        }

        const existingReward = await this.referralRewardsRepo.findOne({
          where: { referredUserId: user.id },
        });

        if (existingReward) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Referral code has already been applied to this account",
          });
        }

        const reward = this.referralRewardsRepo.create({
          referrerUserId: referralCode.userId,
          referredUserId: user.id,
          referralCodeId: referralCode.id,
          status: ReferralRewardStatus.REGISTERED,
          referrerRewardPoints: REFERRER_REWARD_POINTS,
          referredRewardPoints: REFERRED_REWARD_POINTS,
          rewardedAt: null,
        });

        const saved = await this.referralRewardsRepo.save(reward);

        return {
          ...this.serializeReward(saved),
          referralCode: {
            id: referralCode.id,
            code: referralCode.code,
          },
          message:
            "Referral code applied. Rewards will be credited after student verification.",
        };
      }),

    claimVerifiedReferralRewards: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await this.getOrCreateCurrentUser(ctx);

      const rewards = await this.referralRewardsRepo.find({
        where: [
          { referrerUserId: user.id, status: ReferralRewardStatus.REGISTERED },
          { referredUserId: user.id, status: ReferralRewardStatus.REGISTERED },
          { referrerUserId: user.id, status: ReferralRewardStatus.VERIFIED },
          { referredUserId: user.id, status: ReferralRewardStatus.VERIFIED },
        ],
        order: { createdAt: "DESC" },
      });

      const claimed: ReferralReward[] = [];
      const pending: ReferralReward[] = [];

      for (const reward of rewards) {
        const referredIsVerified = await this.isStudentVerified(
          reward.referredUserId
        );

        if (!referredIsVerified) {
          pending.push(reward);
          continue;
        }

        const claimedReward = await this.rewardReferralIfVerified(reward.id);
        claimed.push(claimedReward);
      }

      return {
        claimed: claimed.map((reward) => this.serializeReward(reward)),
        pending: pending.map((reward) => this.serializeReward(reward)),
      };
    }),
  });
}

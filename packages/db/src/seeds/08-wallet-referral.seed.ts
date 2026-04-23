import type { DataSource } from "typeorm";
import {
  ReferralCode,
  ReferralReward,
  ReferralRewardStatus,
  User,
  Wallet,
  WalletTransaction,
  WalletTransactionSourceType,
  WalletTransactionType,
} from "../entities/index.js";
import { upsertByWhere, logSeedStep } from "./utils.js";

export async function seedWalletsAndReferrals(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const walletRepo = dataSource.getRepository(Wallet);
  const walletTransactionRepo = dataSource.getRepository(WalletTransaction);
  const referralCodeRepo = dataSource.getRepository(ReferralCode);
  const referralRewardRepo = dataSource.getRepository(ReferralReward);

  const alibek = await userRepo.findOne({ where: { email: "alibek@student.satbayev.local" } });
  const madina = await userRepo.findOne({ where: { email: "madina@student.kaznu.local" } });

  if (!alibek || !madina) {
    throw new Error("Wallet/referral prerequisites not found");
  }

  const alibekWallet = await upsertByWhere(walletRepo, { userId: alibek.id }, {
    userId: alibek.id,
    availableBalance: 250,
    lifetimeEarned: 350,
    lifetimeSpent: 100,
  });

  const madinaWallet = await upsertByWhere(walletRepo, { userId: madina.id }, {
    userId: madina.id,
    availableBalance: 100,
    lifetimeEarned: 100,
    lifetimeSpent: 0,
  });

  const alibekReferralCode = await upsertByWhere(referralCodeRepo, { userId: alibek.id }, {
    userId: alibek.id,
    code: "ALIBEK25",
    isActive: true,
  });

  await upsertByWhere(referralRewardRepo, { referredUserId: madina.id }, {
    referrerUserId: alibek.id,
    referredUserId: madina.id,
    referralCodeId: alibekReferralCode.id,
    status: ReferralRewardStatus.REWARDED,
    referrerRewardPoints: 100,
    referredRewardPoints: 100,
    rewardedAt: new Date(),
  });

  await upsertByWhere(walletTransactionRepo, { walletId: alibekWallet.id, sourceType: WalletTransactionSourceType.REFERRAL, sourceId: madina.id }, {
    walletId: alibekWallet.id,
    userId: alibek.id,
    type: WalletTransactionType.EARN,
    sourceType: WalletTransactionSourceType.REFERRAL,
    sourceId: madina.id,
    pointsDelta: 100,
    balanceAfter: 250,
    comment: "Бонус за приглашение друга",
  });

  await upsertByWhere(walletTransactionRepo, { walletId: madinaWallet.id, sourceType: WalletTransactionSourceType.REFERRAL, sourceId: alibek.id }, {
    walletId: madinaWallet.id,
    userId: madina.id,
    type: WalletTransactionType.EARN,
    sourceType: WalletTransactionSourceType.REFERRAL,
    sourceId: alibek.id,
    pointsDelta: 100,
    balanceAfter: 100,
    comment: "Бонус за регистрацию по реферальному коду",
  });

  await logSeedStep(dataSource, "Wallets, wallet transactions and referrals seeded");
}

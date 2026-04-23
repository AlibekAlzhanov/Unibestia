import type { DataSource } from "typeorm";
import {
  Offer,
  Partner,
  PartnerLocation,
  Redemption,
  RedemptionStatus,
  Review,
  ReviewStatus,
  User,
  Wallet,
  WalletTransaction,
  WalletTransactionSourceType,
  WalletTransactionType,
} from "../entities/index.js";
import { upsertByWhere, logSeedStep } from "./utils.js";

export async function seedRedemptionsAndReviews(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const offerRepo = dataSource.getRepository(Offer);
  const partnerRepo = dataSource.getRepository(Partner);
  const locationRepo = dataSource.getRepository(PartnerLocation);
  const redemptionRepo = dataSource.getRepository(Redemption);
  const reviewRepo = dataSource.getRepository(Review);
  const walletRepo = dataSource.getRepository(Wallet);
  const walletTransactionRepo = dataSource.getRepository(WalletTransaction);

  const alibek = await userRepo.findOne({ where: { email: "alibek@student.satbayev.local" } });
  const admin = await userRepo.findOne({ where: { email: "admin@unibestie.local" } });
  const partner = await partnerRepo.findOne({ where: { brandName: "Coffee Lab" } });
  const offer = await offerRepo.findOne({ where: { slug: "coffee-lab-15" } });
  const location = await locationRepo.findOne({ where: { name: "Coffee Lab Satbayev" } });
  const wallet = alibek ? await walletRepo.findOne({ where: { userId: alibek.id } }) : null;

  if (!alibek || !admin || !partner || !offer || !location || !wallet) {
    throw new Error("Redemption/review prerequisites not found");
  }

  const redemption = await upsertByWhere(redemptionRepo, { qrToken: "QR-SEED-ALIBEK-001" }, {
    userId: alibek.id,
    offerId: offer.id,
    partnerId: partner.id,
    locationId: location.id,
    status: RedemptionStatus.USED,
    qrToken: "QR-SEED-ALIBEK-001",
    qrExpiresAt: new Date("2026-12-31T23:59:59.000Z"),
    orderAmount: "2500.00",
    discountAmount: "375.00",
    bonusEarned: 10,
    bonusSpent: 0,
    usedAt: new Date(),
  });

  await upsertByWhere(reviewRepo, { redemptionId: redemption.id }, {
    userId: alibek.id,
    offerId: offer.id,
    redemptionId: redemption.id,
    rating: 5,
    text: "Удобная скидка, быстро сработал QR-код, кофе вкусный.",
    status: ReviewStatus.VISIBLE,
    moderatedByUserId: admin.id,
    moderatedAt: new Date(),
    moderationComment: "Одобрено автоматически для демо-стенда",
  });

  await upsertByWhere(walletTransactionRepo, {
    walletId: wallet.id,
    sourceType: WalletTransactionSourceType.REDEMPTION,
    sourceId: redemption.id,
  }, {
    walletId: wallet.id,
    userId: alibek.id,
    type: WalletTransactionType.EARN,
    sourceType: WalletTransactionSourceType.REDEMPTION,
    sourceId: redemption.id,
    pointsDelta: 10,
    balanceAfter: 250,
    comment: "Начисление бонусов за покупку по акции Coffee Lab",
  });

  await logSeedStep(dataSource, "Redemptions, reviews and redemption wallet transaction seeded");
}

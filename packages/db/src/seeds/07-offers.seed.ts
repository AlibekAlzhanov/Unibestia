import type { DataSource } from "typeorm";
import {
  Offer,
  OfferBenefitType,
  OfferCategory,
  OfferDiscountType,
  OfferLocation,
  OfferMedia,
  OfferMediaType,
  OfferStatus,
  Partner,
  PartnerLocation,
  User,
} from "../entities/index.js";
import { upsertByWhere, logSeedStep } from "./utils.js";

export async function seedOffers(dataSource: DataSource): Promise<void> {
  const partnerRepo = dataSource.getRepository(Partner);
  const categoryRepo = dataSource.getRepository(OfferCategory);
  const userRepo = dataSource.getRepository(User);
  const offerRepo = dataSource.getRepository(Offer);
  const mediaRepo = dataSource.getRepository(OfferMedia);
  const locationRepo = dataSource.getRepository(PartnerLocation);
  const offerLocationRepo = dataSource.getRepository(OfferLocation);

  const partner = await partnerRepo.findOne({ where: { brandName: "Coffee Lab" } });
  const owner = await userRepo.findOne({ where: { email: "owner@coffeelab.local" } });
  const foodCategory = await categoryRepo.findOne({ where: { slug: "food" } });

  if (!partner || !owner || !foodCategory) {
    throw new Error("Offer seed prerequisites not found");
  }

  const megaLocation = await locationRepo.findOne({
    where: { partnerId: partner.id, name: "Coffee Lab Mega" },
  });

  const satbayevLocation = await locationRepo.findOne({
    where: { partnerId: partner.id, name: "Coffee Lab Satbayev" },
  });

  const offer1 = await upsertByWhere(offerRepo, { slug: "coffee-lab-15" }, {
    partnerId: partner.id,
    categoryId: foodCategory.id,
    title: "Скидка 15% на кофе и десерты",
    slug: "coffee-lab-15",
    shortDescription: "Горячие напитки и десерты со студенческой скидкой.",
    description:
      "Студенты UniBestie получают 15% скидку на кофе, чай и десерты при предъявлении активного QR-кода в приложении или на сайте.",
    benefitType: OfferBenefitType.DISCOUNT,
    discountType: OfferDiscountType.PERCENT,
    discountValue: "15.00",
    cashbackPercent: null,
    bonusRewardPoints: 10,
    minPurchaseAmount: "1500.00",
    terms: "Скидка действует 1 раз в день на одного студента.",
    usageLimitPerUser: 30,
    totalUsageLimit: 5000,
    startAt: new Date("2026-01-01T00:00:00.000Z"),
    endAt: new Date("2026-12-31T23:59:59.000Z"),
    status: OfferStatus.PUBLISHED,
    isFeatured: true,
    publishedAt: new Date(),
    createdByUserId: owner.id,
    updatedByUserId: owner.id,
  });

  await upsertByWhere(mediaRepo, { offerId: offer1.id, fileUrl: "https://example.local/images/coffee-lab-15-cover.jpg" }, {
    offerId: offer1.id,
    mediaType: OfferMediaType.IMAGE,
    fileUrl: "https://example.local/images/coffee-lab-15-cover.jpg",
    sortOrder: 1,
    isCover: true,
  });

  const offer2 = await upsertByWhere(offerRepo, { slug: "coffee-lab-breakfast-20" }, {
    partnerId: partner.id,
    categoryId: foodCategory.id,
    title: "Завтрак со скидкой 20%",
    slug: "coffee-lab-breakfast-20",
    shortDescription: "Утренние комбо по специальной студенческой цене.",
    description:
      "Скидка 20% на завтраки с 08:00 до 11:00. Подходит для студентов перед учёбой и между парами.",
    benefitType: OfferBenefitType.MIXED,
    discountType: OfferDiscountType.PERCENT,
    discountValue: "20.00",
    cashbackPercent: "5.00",
    bonusRewardPoints: 15,
    minPurchaseAmount: "2000.00",
    terms: "Акция действует только утром и только в выбранных точках.",
    usageLimitPerUser: 20,
    totalUsageLimit: 3000,
    startAt: new Date("2026-01-01T00:00:00.000Z"),
    endAt: new Date("2026-12-31T23:59:59.000Z"),
    status: OfferStatus.PUBLISHED,
    isFeatured: false,
    publishedAt: new Date(),
    createdByUserId: owner.id,
    updatedByUserId: owner.id,
  });

  await upsertByWhere(mediaRepo, { offerId: offer2.id, fileUrl: "https://example.local/images/coffee-lab-breakfast-cover.jpg" }, {
    offerId: offer2.id,
    mediaType: OfferMediaType.BANNER,
    fileUrl: "https://example.local/images/coffee-lab-breakfast-cover.jpg",
    sortOrder: 1,
    isCover: true,
  });

  if (megaLocation) {
    await upsertByWhere(offerLocationRepo, { offerId: offer1.id, locationId: megaLocation.id }, {
      offerId: offer1.id,
      locationId: megaLocation.id,
    });

    await upsertByWhere(offerLocationRepo, { offerId: offer2.id, locationId: megaLocation.id }, {
      offerId: offer2.id,
      locationId: megaLocation.id,
    });
  }

  if (satbayevLocation) {
    await upsertByWhere(offerLocationRepo, { offerId: offer1.id, locationId: satbayevLocation.id }, {
      offerId: offer1.id,
      locationId: satbayevLocation.id,
    });

    await upsertByWhere(offerLocationRepo, { offerId: offer2.id, locationId: satbayevLocation.id }, {
      offerId: offer2.id,
      locationId: satbayevLocation.id,
    });
  }

  await logSeedStep(dataSource, "Offers, offer media and offer locations seeded");
}

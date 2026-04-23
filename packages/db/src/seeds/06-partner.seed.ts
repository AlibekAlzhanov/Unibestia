import type { DataSource } from "typeorm";
import {
  Partner,
  PartnerLocation,
  PartnerMember,
  PartnerMemberRole,
  PartnerStatus,
  User,
} from "../entities/index.js";
import { upsertByWhere, logSeedStep } from "./utils.js";

export async function seedPartners(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const partnerRepo = dataSource.getRepository(Partner);
  const memberRepo = dataSource.getRepository(PartnerMember);
  const locationRepo = dataSource.getRepository(PartnerLocation);

  const admin = await userRepo.findOne({ where: { email: "admin@unibestie.local" } });
  const owner = await userRepo.findOne({ where: { email: "owner@coffeelab.local" } });
  const cashier = await userRepo.findOne({ where: { email: "cashier@coffeelab.local" } });

  if (!admin || !owner || !cashier) {
    throw new Error("Partner seed prerequisites not found");
  }

  const partner = await upsertByWhere(partnerRepo, { brandName: "Coffee Lab" }, {
    legalName: "Coffee Lab LLP",
    brandName: "Coffee Lab",
    description: "Сеть кофеен со студенческими скидками и бонусами.",
    contactEmail: "owner@coffeelab.local",
    contactPhone: "+77010000001",
    websiteUrl: "https://coffeelab.local",
    instagramUrl: "https://instagram.com/coffeelab.local",
    logoUrl: "https://example.local/images/coffee-lab-logo.png",
    status: PartnerStatus.APPROVED,
    createdByUserId: owner.id,
    approvedByUserId: admin.id,
    approvedAt: new Date(),
  });

  await upsertByWhere(memberRepo, { partnerId: partner.id, userId: owner.id }, {
    partnerId: partner.id,
    userId: owner.id,
    memberRole: PartnerMemberRole.OWNER,
    isActive: true,
  });

  await upsertByWhere(memberRepo, { partnerId: partner.id, userId: cashier.id }, {
    partnerId: partner.id,
    userId: cashier.id,
    memberRole: PartnerMemberRole.STAFF,
    isActive: true,
  });

  await upsertByWhere(locationRepo, { partnerId: partner.id, name: "Coffee Lab Mega" }, {
    partnerId: partner.id,
    name: "Coffee Lab Mega",
    city: "Almaty",
    address: "улица Розыбакиева, Mega Center",
    latitude: "43.201700",
    longitude: "76.892200",
    isActive: true,
  });

  await upsertByWhere(locationRepo, { partnerId: partner.id, name: "Coffee Lab Satbayev" }, {
    partnerId: partner.id,
    name: "Coffee Lab Satbayev",
    city: "Almaty",
    address: "улица Сатпаева, рядом с кампусом",
    latitude: "43.236100",
    longitude: "76.927300",
    isActive: true,
  });

  await logSeedStep(dataSource, "Partners, members and locations seeded");
}

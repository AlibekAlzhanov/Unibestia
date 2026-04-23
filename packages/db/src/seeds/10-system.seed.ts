import type { DataSource } from "typeorm";
import {
  AuditLog,
  ModerationDecision,
  ModerationEntityType,
  ModerationTask,
  ModerationTaskStatus,
  Notification,
  NotificationChannel,
  NotificationType,
  Offer,
  Partner,
  StudentVerification,
  User,
} from "../entities/index.js";
import { upsertByWhere, logSeedStep } from "./utils.js";

export async function seedSystemTables(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const notificationRepo = dataSource.getRepository(Notification);
  const moderationRepo = dataSource.getRepository(ModerationTask);
  const auditRepo = dataSource.getRepository(AuditLog);
  const offerRepo = dataSource.getRepository(Offer);
  const partnerRepo = dataSource.getRepository(Partner);
  const verificationRepo = dataSource.getRepository(StudentVerification);

  const admin = await userRepo.findOne({ where: { email: "admin@unibestie.local" } });
  const owner = await userRepo.findOne({ where: { email: "owner@coffeelab.local" } });
  const alibek = await userRepo.findOne({ where: { email: "alibek@student.satbayev.local" } });
  const offer = await offerRepo.findOne({ where: { slug: "coffee-lab-15" } });
  const partner = await partnerRepo.findOne({ where: { brandName: "Coffee Lab" } });
  const verification = alibek
    ? await verificationRepo.findOne({ where: { userId: alibek.id } })
    : null;

  if (!admin || !owner || !alibek || !offer || !partner || !verification) {
    throw new Error("System seed prerequisites not found");
  }

  await upsertByWhere(notificationRepo, { userId: alibek.id, title: "Верификация подтверждена" }, {
    userId: alibek.id,
    type: NotificationType.VERIFICATION_STATUS,
    channel: NotificationChannel.IN_APP,
    title: "Верификация подтверждена",
    body: "Твой студенческий статус подтверждён. Теперь тебе доступны все скидки и бонусы.",
    isRead: false,
    relatedEntityType: "student_verification",
    relatedEntityId: verification.id,
    sentAt: new Date(),
  });

  await upsertByWhere(notificationRepo, { userId: owner.id, title: "Акция опубликована" }, {
    userId: owner.id,
    type: NotificationType.OFFER_APPROVED,
    channel: NotificationChannel.IN_APP,
    title: "Акция опубликована",
    body: "Акция Coffee Lab 15% прошла модерацию и опубликована.",
    isRead: false,
    relatedEntityType: "offer",
    relatedEntityId: offer.id,
    sentAt: new Date(),
  });

  await upsertByWhere(moderationRepo, { entityType: ModerationEntityType.PARTNER, entityId: partner.id }, {
    entityType: ModerationEntityType.PARTNER,
    entityId: partner.id,
    status: ModerationTaskStatus.APPROVED,
    assignedAdminId: admin.id,
    decision: ModerationDecision.APPROVE,
    decisionComment: "Партнёр проверен и допущен к публикации офферов",
    resolvedByUserId: admin.id,
    resolvedAt: new Date(),
  });

  await upsertByWhere(moderationRepo, { entityType: ModerationEntityType.OFFER, entityId: offer.id }, {
    entityType: ModerationEntityType.OFFER,
    entityId: offer.id,
    status: ModerationTaskStatus.APPROVED,
    assignedAdminId: admin.id,
    decision: ModerationDecision.APPROVE,
    decisionComment: "Акция соответствует правилам платформы",
    resolvedByUserId: admin.id,
    resolvedAt: new Date(),
  });

  await upsertByWhere(auditRepo, { action: "partner.approved", entityId: partner.id }, {
    actorUserId: admin.id,
    actorRole: "admin",
    action: "partner.approved",
    entityType: "partner",
    entityId: partner.id,
    partnerId: partner.id,
    metadata: { reason: "demo seed", source: "seed" },
    ipAddress: "127.0.0.1",
    userAgent: "seed-runner",
  });

  await upsertByWhere(auditRepo, { action: "offer.published", entityId: offer.id }, {
    actorUserId: admin.id,
    actorRole: "admin",
    action: "offer.published",
    entityType: "offer",
    entityId: offer.id,
    partnerId: partner.id,
    metadata: { reason: "demo seed", source: "seed" },
    ipAddress: "127.0.0.1",
    userAgent: "seed-runner",
  });

  await logSeedStep(dataSource, "Notifications, moderation tasks and audit logs seeded");
}

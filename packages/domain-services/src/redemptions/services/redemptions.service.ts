import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import {
  Offer,
  Redemption,
  RedemptionStatus,
  StudentVerificationStatus,
} from "@repo/db";
import { RedemptionsRepository } from "../repositories/redemptions.repository.js";

export interface CreateRedemptionInput {
  userId: string;
  offerId: string;
  locationId?: string;
}

export interface QrOperatorInput {
  operatorUserId: string;
  operatorPartnerId: string | null;
  isAdmin: boolean;
}

export interface ValidateRedemptionByQrTokenInput extends QrOperatorInput {
  qrToken: string;
}

export interface ConfirmRedemptionByQrTokenInput extends QrOperatorInput {
  qrToken: string;
  locationId?: string;
  orderAmount?: number;
  discountAmount?: number;
}

export interface CancelRedemptionByQrTokenInput extends QrOperatorInput {
  qrToken: string;
}

const QR_TOKEN_PREFIX = "ubq_";
const QR_TOKEN_BYTES = 32;
const QR_TOKEN_TTL_MINUTES = 5;

@Injectable()
export class RedemptionsService {
  constructor(
    @Inject(RedemptionsRepository)
    private readonly redemptionsRepository: RedemptionsRepository
  ) {}

  async createRedemption(input: CreateRedemptionInput) {
    const studentProfile =
      await this.redemptionsRepository.findStudentProfileByUserId(input.userId);

    if (!studentProfile) {
      throw new NotFoundException("Student profile not found");
    }

    const now = new Date();

    if (studentProfile.verificationStatus !== StudentVerificationStatus.VERIFIED) {
      throw new BadRequestException("Student verification is required");
    }

    if (
      studentProfile.verificationExpiresAt &&
      studentProfile.verificationExpiresAt <= now
    ) {
      studentProfile.verificationStatus = StudentVerificationStatus.EXPIRED;
      throw new BadRequestException("Student verification has expired");
    }

    const offer = await this.redemptionsRepository.findPublishedOfferById(
      input.offerId
    );

    if (!offer) {
      throw new NotFoundException("Published offer not found");
    }

    this.assertOfferActive(offer, now);

    const offerLocationCount =
      await this.redemptionsRepository.getOfferLocationCount(offer.id);

    if (offerLocationCount > 0 && !input.locationId) {
      throw new BadRequestException("Location is required for this offer");
    }

    if (input.locationId) {
      const allowed =
        await this.redemptionsRepository.isActiveOfferLocationAllowed(
          offer.id,
          offer.partnerId,
          input.locationId
        );

      if (!allowed) {
        throw new BadRequestException("Location is not available for this offer");
      }
    }

    if (offer.usageLimitPerUser) {
      const usages = await this.redemptionsRepository.countUserOfferUsages(
        input.userId,
        offer.id
      );

      if (usages >= offer.usageLimitPerUser) {
        throw new BadRequestException("Per-user usage limit exceeded");
      }
    }

    if (offer.totalUsageLimit) {
      const totalUsages = await this.redemptionsRepository.countTotalOfferUsages(
        offer.id
      );

      if (totalUsages >= offer.totalUsageLimit) {
        throw new BadRequestException("Offer usage limit has been reached");
      }
    }

    await this.redemptionsRepository.cancelActiveCreatedRedemptionsForUserOffer(
      input.userId,
      offer.id
    );

    const qrExpiresAt = new Date(
      now.getTime() + QR_TOKEN_TTL_MINUTES * 60 * 1000
    );

    const redemption = await this.redemptionsRepository.createRedemption({
      userId: input.userId,
      offerId: offer.id,
      partnerId: offer.partnerId,
      locationId: input.locationId ?? null,
      status: RedemptionStatus.CREATED,
      qrToken: this.generateSecureQrToken(),
      qrExpiresAt,
      orderAmount: null,
      discountAmount: null,
      bonusEarned: 0,
      bonusSpent: 0,
      usedAt: null,
      cancelledAt: null,
    });

    await this.writeRedemptionAuditLog({
    action: "redemption.created",
    actorUserId: input.userId,
    actorRole: "student",
    redemptionId: redemption.id,
    partnerId: redemption.partnerId,
    metadata: {
      offerId: redemption.offerId,
      locationId: redemption.locationId,
      qrExpiresAt: redemption.qrExpiresAt?.toISOString() ?? null,
      ttlSeconds: QR_TOKEN_TTL_MINUTES * 60,
    },
  });

    return {
      id: redemption.id,
      userId: redemption.userId,
      offerId: redemption.offerId,
      partnerId: redemption.partnerId,
      locationId: redemption.locationId,
      status: redemption.status,
      qrToken: redemption.qrToken,
      qrExpiresAt: redemption.qrExpiresAt,
      ttlSeconds: QR_TOKEN_TTL_MINUTES * 60,
      createdAt: redemption.createdAt,
      offer: {
        id: offer.id,
        slug: offer.slug,
        title: offer.title,
        shortDescription: offer.shortDescription,
      },
    };
  }

  async validateByQrToken(input: ValidateRedemptionByQrTokenInput) {
    const redemption = await this.findUsableRedemptionByQrToken(input);

    await this.writeRedemptionAuditLog({
      action: "redemption.validated",
      actorUserId: input.operatorUserId,
      actorRole: this.getAuditActorRole(input),
      redemptionId: redemption.id,
      partnerId: redemption.partnerId,
      metadata: {
        offerId: redemption.offerId,
        locationId: redemption.locationId,
        operatorPartnerId: input.operatorPartnerId,
        isAdmin: input.isAdmin,
      },
    });

    return this.buildStaffRedemptionResponse(redemption);
  }

  async confirmByQrToken(input: ConfirmRedemptionByQrTokenInput) {
    const redemption = await this.findUsableRedemptionByQrToken(input);

    if (input.locationId) {
      if (redemption.locationId && redemption.locationId !== input.locationId) {
        throw new BadRequestException(
          "QR token was created for another location"
        );
      }

      const allowed =
        await this.redemptionsRepository.isActiveOfferLocationAllowed(
          redemption.offerId,
          redemption.partnerId,
          input.locationId
        );

      if (!allowed) {
        throw new BadRequestException("Location is not available for this offer");
      }

      redemption.locationId = input.locationId;
    }

    const offerLocationCount =
      await this.redemptionsRepository.getOfferLocationCount(redemption.offerId);

    if (offerLocationCount > 0 && !redemption.locationId) {
      throw new BadRequestException("Location is required to confirm this QR");
    }

    if (typeof input.orderAmount === "number") {
      redemption.orderAmount = input.orderAmount.toFixed(2);
    }

    if (typeof input.discountAmount === "number") {
      redemption.discountAmount = input.discountAmount.toFixed(2);
    }

    redemption.status = RedemptionStatus.USED;
    redemption.usedAt = new Date();

    const saved = await this.redemptionsRepository.saveRedemption(redemption);
    await this.writeRedemptionAuditLog({
      action: "redemption.confirmed",
      actorUserId: input.operatorUserId,
      actorRole: this.getAuditActorRole(input),
      redemptionId: saved.id,
      partnerId: saved.partnerId,
      metadata: {
        offerId: saved.offerId,
        locationId: saved.locationId,
        orderAmount: saved.orderAmount,
        discountAmount: saved.discountAmount,
        operatorPartnerId: input.operatorPartnerId,
        isAdmin: input.isAdmin,
      },
    });
    return this.buildStaffRedemptionResponse(saved);
  }

  async cancelByQrToken(input: CancelRedemptionByQrTokenInput) {
    const redemption = await this.findUsableRedemptionByQrToken(input);

    redemption.status = RedemptionStatus.CANCELLED;
    redemption.cancelledAt = new Date();

    const saved = await this.redemptionsRepository.saveRedemption(redemption);
    await this.writeRedemptionAuditLog({
      action: "redemption.cancelled",
      actorUserId: input.operatorUserId,
      actorRole: this.getAuditActorRole(input),
      redemptionId: saved.id,
      partnerId: saved.partnerId,
      metadata: {
        offerId: saved.offerId,
        locationId: saved.locationId,
        operatorPartnerId: input.operatorPartnerId,
        isAdmin: input.isAdmin,
      },
    });
    return this.buildStaffRedemptionResponse(saved);
  }

  async listUserRedemptions(userId: string, limit: number, offset: number) {
    const [items, total] = await this.redemptionsRepository.listUserRedemptions(
      userId,
      limit,
      offset
    );

    const offersMap = await this.redemptionsRepository.getOffersMap(
      items.map((item) => item.offerId)
    );

    const locationIds = items
      .map((item) => item.locationId)
      .filter((value): value is string => Boolean(value));

    const locationsMap = await this.redemptionsRepository.getPartnerLocationsMap(
      locationIds
    );

    return {
      total,
      limit,
      offset,
      items: items.map((item) => {
        const offer = offersMap.get(item.offerId) ?? null;
        const location = item.locationId
          ? (locationsMap.get(item.locationId) ?? null)
          : null;

        return {
          id: item.id,
          status: item.status,
          qrToken: item.qrToken,
          qrExpiresAt: item.qrExpiresAt,
          orderAmount: item.orderAmount,
          discountAmount: item.discountAmount,
          bonusEarned: item.bonusEarned,
          bonusSpent: item.bonusSpent,
          usedAt: item.usedAt,
          cancelledAt: item.cancelledAt,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          offer: offer
            ? {
                id: offer.id,
                slug: offer.slug,
                title: offer.title,
                shortDescription: offer.shortDescription,
              }
            : null,
          location: location
            ? {
                id: location.id,
                name: location.name,
                city: location.city,
                address: location.address,
              }
            : null,
        };
      }),
    };
  }

  async getUserRedemptionById(userId: string, redemptionId: string) {
    const item = await this.redemptionsRepository.findUserRedemptionById(
      userId,
      redemptionId
    );

    if (!item) {
      throw new NotFoundException("Redemption not found");
    }

    const offersMap = await this.redemptionsRepository.getOffersMap([
      item.offerId,
    ]);
    const locationsMap = await this.redemptionsRepository.getPartnerLocationsMap(
      item.locationId ? [item.locationId] : []
    );

    const offer = offersMap.get(item.offerId) ?? null;
    const location = item.locationId
      ? (locationsMap.get(item.locationId) ?? null)
      : null;

    return {
      id: item.id,
      status: item.status,
      qrToken: item.qrToken,
      qrExpiresAt: item.qrExpiresAt,
      orderAmount: item.orderAmount,
      discountAmount: item.discountAmount,
      bonusEarned: item.bonusEarned,
      bonusSpent: item.bonusSpent,
      usedAt: item.usedAt,
      cancelledAt: item.cancelledAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      offer: offer
        ? {
            id: offer.id,
            slug: offer.slug,
            title: offer.title,
            shortDescription: offer.shortDescription,
          }
        : null,
      location: location
        ? {
            id: location.id,
            name: location.name,
            city: location.city,
            address: location.address,
          }
        : null,
    };
  }

  private getAuditActorRole(operator: QrOperatorInput): string {
    return operator.isAdmin ? "admin" : "partner_operator";
  }

  private maskQrToken(qrToken: string): string {
    if (qrToken.length <= 12) {
      return "***";
    }

    return `${qrToken.slice(0, 8)}...${qrToken.slice(-4)}`;
  }

  private async writeRedemptionAuditLog(input: {
    action: string;
    actorUserId?: string | null;
    actorRole?: string | null;
    redemptionId?: string | null;
    partnerId?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    try {
      await this.redemptionsRepository.createAuditLog({
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entityType: "redemption",
        entityId: input.redemptionId ?? null,
        partnerId: input.partnerId ?? null,
        metadata: input.metadata ?? null,
        ipAddress: null,
        userAgent: null,
      });
    } catch {
      // Audit logging must not break the QR flow.
    }
  }

  private generateSecureQrToken(): string {
    return `${QR_TOKEN_PREFIX}${randomBytes(QR_TOKEN_BYTES).toString(
      "base64url"
    )}`;
  }

  private assertOfferActive(offer: Offer, now = new Date()): void {
    if (offer.startAt > now) {
      throw new BadRequestException("Offer is not active yet");
    }

    if (offer.endAt && offer.endAt < now) {
      throw new BadRequestException("Offer has expired");
    }
  }

  private async assertOperatorCanAccessRedemption(
    redemption: Redemption,
    operator: QrOperatorInput
  ): Promise<void> {
    if (operator.isAdmin) {
      return;
    }

    if (!operator.operatorPartnerId) {
      await this.writeRedemptionAuditLog({
        action: "redemption.access_denied",
        actorUserId: operator.operatorUserId,
        actorRole: this.getAuditActorRole(operator),
        redemptionId: redemption.id,
        partnerId: redemption.partnerId,
        metadata: {
          reason: "missing_operator_partner",
          offerId: redemption.offerId,
        },
      });

      throw new BadRequestException("Partner operator is required");
    }

    if (redemption.partnerId !== operator.operatorPartnerId) {
      await this.writeRedemptionAuditLog({
        action: "redemption.access_denied",
        actorUserId: operator.operatorUserId,
        actorRole: this.getAuditActorRole(operator),
        redemptionId: redemption.id,
        partnerId: redemption.partnerId,
        metadata: {
          reason: "partner_mismatch",
          offerId: redemption.offerId,
          operatorPartnerId: operator.operatorPartnerId,
        },
      });

      throw new NotFoundException("Redemption not found for this partner");
    }
  }

  private async findUsableRedemptionByQrToken(
    input: ValidateRedemptionByQrTokenInput
  ): Promise<Redemption> {
    const redemption =
      await this.redemptionsRepository.findRedemptionByQrToken(input.qrToken);

    if (!redemption) {
      await this.writeRedemptionAuditLog({
        action: "redemption.qr_lookup_failed",
        actorUserId: input.operatorUserId,
        actorRole: this.getAuditActorRole(input),
        redemptionId: null,
        partnerId: input.operatorPartnerId,
        metadata: {
          reason: "not_found",
          qrTokenPreview: this.maskQrToken(input.qrToken),
          isAdmin: input.isAdmin,
        },
      });

      throw new NotFoundException("Redemption not found");
    }

    await this.assertOperatorCanAccessRedemption(redemption, input);

    if (redemption.status === RedemptionStatus.USED) {
      await this.writeRedemptionAuditLog({
        action: "redemption.qr_use_rejected",
        actorUserId: input.operatorUserId,
        actorRole: this.getAuditActorRole(input),
        redemptionId: redemption.id,
        partnerId: redemption.partnerId,
        metadata: {
          reason: "already_used",
          offerId: redemption.offerId,
          operatorPartnerId: input.operatorPartnerId,
        },
      });

      throw new BadRequestException("Redemption has already been used");
    }

    if (redemption.status === RedemptionStatus.CANCELLED) {
      await this.writeRedemptionAuditLog({
        action: "redemption.qr_use_rejected",
        actorUserId: input.operatorUserId,
        actorRole: this.getAuditActorRole(input),
        redemptionId: redemption.id,
        partnerId: redemption.partnerId,
        metadata: {
          reason: "cancelled",
          offerId: redemption.offerId,
          operatorPartnerId: input.operatorPartnerId,
        },
      });

      throw new BadRequestException("Redemption has been cancelled");
    }

    if (redemption.status === RedemptionStatus.EXPIRED) {
      await this.writeRedemptionAuditLog({
        action: "redemption.qr_use_rejected",
        actorUserId: input.operatorUserId,
        actorRole: this.getAuditActorRole(input),
        redemptionId: redemption.id,
        partnerId: redemption.partnerId,
        metadata: {
          reason: "already_expired",
          offerId: redemption.offerId,
          operatorPartnerId: input.operatorPartnerId,
        },
      });

      throw new BadRequestException("Redemption has expired");
    }

    const now = new Date();

    if (redemption.qrExpiresAt && redemption.qrExpiresAt <= now) {
      redemption.status = RedemptionStatus.EXPIRED;
      await this.redemptionsRepository.saveRedemption(redemption);

      await this.writeRedemptionAuditLog({
        action: "redemption.expired",
        actorUserId: input.operatorUserId,
        actorRole: this.getAuditActorRole(input),
        redemptionId: redemption.id,
        partnerId: redemption.partnerId,
        metadata: {
          reason: "ttl_expired",
          offerId: redemption.offerId,
          qrExpiresAt: redemption.qrExpiresAt.toISOString(),
          operatorPartnerId: input.operatorPartnerId,
        },
      });

      throw new BadRequestException("QR token has expired");
    }

    const offer = await this.redemptionsRepository.findOfferById(
      redemption.offerId
    );

    if (!offer) {
      redemption.status = RedemptionStatus.CANCELLED;
      redemption.cancelledAt = now;
      await this.redemptionsRepository.saveRedemption(redemption);
      throw new BadRequestException("Offer is no longer available");
    }

    this.assertOfferActive(offer, now);

    return redemption;
  }

  private async buildStaffRedemptionResponse(redemption: Redemption) {
    const [offersMap, usersMap, partnersMap, locationsMap] = await Promise.all([
      this.redemptionsRepository.getOffersMap([redemption.offerId]),
      this.redemptionsRepository.getUsersMap([redemption.userId]),
      this.redemptionsRepository.getPartnersMap([redemption.partnerId]),
      this.redemptionsRepository.getPartnerLocationsMap(
        redemption.locationId ? [redemption.locationId] : []
      ),
    ]);

    const offer = offersMap.get(redemption.offerId) ?? null;
    const user = usersMap.get(redemption.userId) ?? null;
    const partner = partnersMap.get(redemption.partnerId) ?? null;
    const location = redemption.locationId
      ? (locationsMap.get(redemption.locationId) ?? null)
      : null;

    return {
      id: redemption.id,
      status: redemption.status,
      qrToken: redemption.qrToken,
      qrExpiresAt: redemption.qrExpiresAt,
      remainingSeconds: redemption.qrExpiresAt
        ? Math.max(
            0,
            Math.floor((redemption.qrExpiresAt.getTime() - Date.now()) / 1000)
          )
        : null,
      orderAmount: redemption.orderAmount,
      discountAmount: redemption.discountAmount,
      bonusEarned: redemption.bonusEarned,
      bonusSpent: redemption.bonusSpent,
      usedAt: redemption.usedAt,
      cancelledAt: redemption.cancelledAt,
      createdAt: redemption.createdAt,
      updatedAt: redemption.updatedAt,
      offer: offer
        ? {
            id: offer.id,
            slug: offer.slug,
            title: offer.title,
            shortDescription: offer.shortDescription,
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            benefitType: offer.benefitType,
          }
        : null,
      student: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            status: user.status,
          }
        : null,
      partner: partner
        ? {
            id: partner.id,
            brandName: partner.brandName,
            logoUrl: partner.logoUrl,
          }
        : null,
      location: location
        ? {
            id: location.id,
            name: location.name,
            city: location.city,
            address: location.address,
          }
        : null,
    };
  }
}

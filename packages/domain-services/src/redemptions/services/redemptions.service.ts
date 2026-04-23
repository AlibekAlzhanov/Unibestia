import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  RedemptionStatus,
  StudentVerificationStatus,
} from "@repo/db";
import { RedemptionsRepository } from "../repositories/redemptions.repository.js";

export interface CreateRedemptionInput {
  userId: string;
  offerId: string;
  locationId?: string;
}

@Injectable()
export class RedemptionsService {
  constructor(
    private readonly redemptionsRepository: RedemptionsRepository
  ) {}

  async createRedemption(input: CreateRedemptionInput) {
    const studentProfile =
      await this.redemptionsRepository.findStudentProfileByUserId(input.userId);

    if (!studentProfile) {
      throw new NotFoundException("Student profile not found");
    }

    if (studentProfile.verificationStatus !== StudentVerificationStatus.VERIFIED) {
      throw new BadRequestException("Student verification is required");
    }

    const offer = await this.redemptionsRepository.findPublishedOfferById(input.offerId);

    if (!offer) {
      throw new NotFoundException("Published offer not found");
    }

    const now = new Date();

    if (offer.startAt > now) {
      throw new BadRequestException("Offer is not active yet");
    }

    if (offer.endAt && offer.endAt < now) {
      throw new BadRequestException("Offer has expired");
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

    if (input.locationId) {
      const allowed = await this.redemptionsRepository.isOfferLocationAllowed(
        offer.id,
        input.locationId
      );

      if (!allowed) {
        throw new BadRequestException("Location is not available for this offer");
      }
    }

    const qrExpiresAt = new Date(now.getTime() + 30 * 60 * 1000);

    const redemption = await this.redemptionsRepository.createRedemption({
      userId: input.userId,
      offerId: offer.id,
      partnerId: offer.partnerId,
      locationId: input.locationId ?? null,
      status: RedemptionStatus.CREATED,
      qrToken: `red_${randomUUID()}`,
      qrExpiresAt,
      orderAmount: null,
      discountAmount: null,
      bonusEarned: 0,
      bonusSpent: 0,
      usedAt: null,
      cancelledAt: null,
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
      createdAt: redemption.createdAt,
      offer: {
        id: offer.id,
        slug: offer.slug,
        title: offer.title,
        shortDescription: offer.shortDescription,
      },
    };
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

    const offersMap = await this.redemptionsRepository.getOffersMap([item.offerId]);
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
}

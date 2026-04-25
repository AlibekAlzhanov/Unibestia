import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import {
  Offer,
  OfferLocation,
  OfferStatus,
  Partner,
  PartnerLocation,
  Redemption,
  RedemptionStatus,
  StudentProfile,
  User,
} from "@repo/db";

@Injectable()
export class RedemptionsRepository {
  constructor(
    @InjectRepository(Redemption)
    private readonly redemptionsRepo: Repository<Redemption>,
    @InjectRepository(Offer)
    private readonly offersRepo: Repository<Offer>,
    @InjectRepository(StudentProfile)
    private readonly studentProfilesRepo: Repository<StudentProfile>,
    @InjectRepository(OfferLocation)
    private readonly offerLocationsRepo: Repository<OfferLocation>,
    @InjectRepository(PartnerLocation)
    private readonly partnerLocationsRepo: Repository<PartnerLocation>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Partner)
    private readonly partnersRepo: Repository<Partner>
  ) {}

  async findPublishedOfferById(offerId: string): Promise<Offer | null> {
    return this.offersRepo.findOne({
      where: {
        id: offerId,
        status: OfferStatus.PUBLISHED,
      },
    });
  }

  async findOfferById(offerId: string): Promise<Offer | null> {
    return this.offersRepo.findOne({
      where: {
        id: offerId,
      },
    });
  }

  async findStudentProfileByUserId(userId: string): Promise<StudentProfile | null> {
    return this.studentProfilesRepo.findOne({
      where: { userId },
    });
  }

  async countUserOfferUsages(userId: string, offerId: string): Promise<number> {
    return this.redemptionsRepo.count({
      where: {
        userId,
        offerId,
        status: In([
          RedemptionStatus.CONFIRMED,
          RedemptionStatus.USED,
        ]),
      },
    });
  }

  async countTotalOfferUsages(offerId: string): Promise<number> {
    return this.redemptionsRepo.count({
      where: {
        offerId,
        status: In([
          RedemptionStatus.CONFIRMED,
          RedemptionStatus.USED,
        ]),
      },
    });
  }

  async getOfferLocationCount(offerId: string): Promise<number> {
    return this.offerLocationsRepo.count({
      where: {
        offerId,
      },
    });
  }

  async isOfferLocationAllowed(
    offerId: string,
    locationId: string
  ): Promise<boolean> {
    const count = await this.offerLocationsRepo.count({
      where: {
        offerId,
        locationId,
      },
    });

    return count > 0;
  }

  async isActiveOfferLocationAllowed(
    offerId: string,
    partnerId: string,
    locationId: string
  ): Promise<boolean> {
    const location = await this.partnerLocationsRepo.findOne({
      where: {
        id: locationId,
        partnerId,
        isActive: true,
      },
    });

    if (!location) {
      return false;
    }

    const offerLocationCount = await this.offerLocationsRepo.count({
      where: {
        offerId,
        locationId,
      },
    });

    return offerLocationCount > 0;
  }

  async findPartnerLocationsByIds(ids: string[]): Promise<PartnerLocation[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.partnerLocationsRepo.find({
      where: { id: In(ids) },
    });
  }

  async cancelActiveCreatedRedemptionsForUserOffer(
    userId: string,
    offerId: string
  ): Promise<void> {
    await this.redemptionsRepo.update(
      {
        userId,
        offerId,
        status: RedemptionStatus.CREATED,
      },
      {
        status: RedemptionStatus.CANCELLED,
        cancelledAt: new Date(),
      }
    );
  }

  async createRedemption(data: Partial<Redemption>): Promise<Redemption> {
    const created = this.redemptionsRepo.create(data);
    return this.redemptionsRepo.save(created);
  }

  async saveRedemption(redemption: Redemption): Promise<Redemption> {
    return this.redemptionsRepo.save(redemption);
  }

  async findRedemptionByQrToken(qrToken: string): Promise<Redemption | null> {
    return this.redemptionsRepo.findOne({
      where: { qrToken },
    });
  }

  async listUserRedemptions(
    userId: string,
    limit: number,
    offset: number
  ): Promise<[Redemption[], number]> {
    return this.redemptionsRepo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async findUserRedemptionById(
    userId: string,
    redemptionId: string
  ): Promise<Redemption | null> {
    return this.redemptionsRepo.findOne({
      where: {
        id: redemptionId,
        userId,
      },
    });
  }

  async getOffersMap(offerIds: string[]): Promise<Map<string, Offer>> {
    if (offerIds.length === 0) {
      return new Map<string, Offer>();
    }

    const offers = await this.offersRepo.find({
      where: { id: In(offerIds) },
    });

    return new Map(offers.map((offer) => [offer.id, offer]));
  }

  async getUsersMap(userIds: string[]): Promise<Map<string, User>> {
    if (userIds.length === 0) {
      return new Map<string, User>();
    }

    const users = await this.usersRepo.find({
      where: { id: In(userIds) },
    });

    return new Map(users.map((user) => [user.id, user]));
  }

  async getPartnersMap(partnerIds: string[]): Promise<Map<string, Partner>> {
    if (partnerIds.length === 0) {
      return new Map<string, Partner>();
    }

    const partners = await this.partnersRepo.find({
      where: { id: In(partnerIds) },
    });

    return new Map(partners.map((partner) => [partner.id, partner]));
  }

  async getPartnerLocationsMap(
    locationIds: string[]
  ): Promise<Map<string, PartnerLocation>> {
    if (locationIds.length === 0) {
      return new Map<string, PartnerLocation>();
    }

    const locations = await this.partnerLocationsRepo.find({
      where: { id: In(locationIds) },
    });

    return new Map(locations.map((location) => [location.id, location]));
  }
}

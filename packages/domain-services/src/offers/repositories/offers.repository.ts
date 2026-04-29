import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import {
  Offer,
  OfferCategory,
  OfferLocation,
  OfferMedia,
  OfferStatus,
  Partner,
  PartnerLocation,
  Review,
  ReviewStatus,
} from "@repo/db";

export interface ListPublishedOffersParams {
  categoryId?: string;
  search?: string;
  featuredOnly?: boolean;
  limit: number;
  offset: number;
}

function uniqueNonEmptyIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

@Injectable()
export class OffersRepository {
  constructor(
    @InjectRepository(Offer)
    private readonly offersRepo: Repository<Offer>,
    @InjectRepository(OfferCategory)
    private readonly offerCategoriesRepo: Repository<OfferCategory>,
    @InjectRepository(OfferMedia)
    private readonly offerMediaRepo: Repository<OfferMedia>,
    @InjectRepository(OfferLocation)
    private readonly offerLocationsRepo: Repository<OfferLocation>,
    @InjectRepository(PartnerLocation)
    private readonly partnerLocationsRepo: Repository<PartnerLocation>,
    @InjectRepository(Partner)
    private readonly partnersRepo: Repository<Partner>,
    @InjectRepository(Review)
    private readonly reviewsRepo: Repository<Review>
  ) {}

  async listActiveCategories(): Promise<OfferCategory[]> {
    return this.offerCategoriesRepo
      .createQueryBuilder("category")
      .select([
        "category.id",
        "category.name",
        "category.slug",
        "category.parentId",
        "category.sortOrder",
        "category.isActive",
        "category.createdAt",
      ])
      .where("category.isActive = :isActive", { isActive: true })
      .orderBy("category.sortOrder", "ASC")
      .addOrderBy("category.name", "ASC")
      .getMany();
  }

  async findCategoryBySlug(slug: string): Promise<OfferCategory | null> {
    return this.offerCategoriesRepo
      .createQueryBuilder("category")
      .select([
        "category.id",
        "category.name",
        "category.slug",
        "category.parentId",
        "category.sortOrder",
        "category.isActive",
        "category.createdAt",
      ])
      .where("category.slug = :slug", { slug })
      .andWhere("category.isActive = :isActive", { isActive: true })
      .getOne();
  }

  async listPublishedOffers(
    params: ListPublishedOffersParams
  ): Promise<[Offer[], number]> {
    const limit = Math.min(Math.max(params.limit, 1), 50);
    const offset = Math.max(params.offset, 0);

    const qb = this.offersRepo
      .createQueryBuilder("offer")
      .select([
        "offer.id",
        "offer.partnerId",
        "offer.categoryId",
        "offer.title",
        "offer.slug",
        "offer.shortDescription",
        "offer.description",
        "offer.benefitType",
        "offer.discountType",
        "offer.discountValue",
        "offer.cashbackPercent",
        "offer.bonusRewardPoints",
        "offer.minPurchaseAmount",
        "offer.startAt",
        "offer.endAt",
        "offer.status",
        "offer.isFeatured",
        "offer.publishedAt",
        "offer.createdAt",
      ])
      .where("offer.status = :status", { status: OfferStatus.PUBLISHED });

    if (params.categoryId) {
      qb.andWhere("offer.categoryId = :categoryId", {
        categoryId: params.categoryId,
      });
    }

    if (params.featuredOnly) {
      qb.andWhere("offer.isFeatured = :isFeatured", { isFeatured: true });
    }

    const normalizedSearch = params.search?.trim();

    if (normalizedSearch) {
      const search = `%${escapeLikePattern(normalizedSearch)}%`;

      qb.andWhere(
        `(offer.title ILIKE :search ESCAPE '\\'
          OR COALESCE(offer.shortDescription, '') ILIKE :search ESCAPE '\\'
          OR offer.description ILIKE :search ESCAPE '\\')`,
        { search }
      );
    }

    qb.orderBy("offer.isFeatured", "DESC")
      .addOrderBy("offer.publishedAt", "DESC", "NULLS LAST")
      .addOrderBy("offer.createdAt", "DESC")
      .skip(offset)
      .take(limit);

    return qb.getManyAndCount();
  }

  async findPublishedOfferBySlug(slug: string): Promise<Offer | null> {
    return this.offersRepo.findOne({
      where: { slug, status: OfferStatus.PUBLISHED },
    });
  }

  async getOfferCoverMap(offerIds: string[]): Promise<Map<string, OfferMedia>> {
    const uniqueOfferIds = uniqueNonEmptyIds(offerIds);

    if (uniqueOfferIds.length === 0) {
      return new Map<string, OfferMedia>();
    }

    const media = await this.offerMediaRepo
      .createQueryBuilder("media")
      .distinctOn(["media.offerId"])
      .where("media.offerId IN (:...offerIds)", { offerIds: uniqueOfferIds })
      .orderBy("media.offerId", "ASC")
      .addOrderBy("media.isCover", "DESC")
      .addOrderBy("media.sortOrder", "ASC")
      .addOrderBy("media.createdAt", "ASC")
      .getMany();

    return new Map(media.map((item) => [item.offerId, item]));
  }

  async getPartnerMap(partnerIds: string[]): Promise<Map<string, Partner>> {
    const uniquePartnerIds = uniqueNonEmptyIds(partnerIds);

    if (uniquePartnerIds.length === 0) {
      return new Map<string, Partner>();
    }

    const partners = await this.partnersRepo
      .createQueryBuilder("partner")
      .select(["partner.id", "partner.brandName", "partner.logoUrl"])
      .where("partner.id IN (:...partnerIds)", {
        partnerIds: uniquePartnerIds,
      })
      .getMany();

    return new Map(partners.map((partner) => [partner.id, partner]));
  }

  async getCategoryMap(
    categoryIds: string[]
  ): Promise<Map<string, OfferCategory>> {
    const uniqueCategoryIds = uniqueNonEmptyIds(categoryIds);

    if (uniqueCategoryIds.length === 0) {
      return new Map<string, OfferCategory>();
    }

    const categories = await this.offerCategoriesRepo
      .createQueryBuilder("category")
      .select(["category.id", "category.name", "category.slug"])
      .where("category.id IN (:...categoryIds)", {
        categoryIds: uniqueCategoryIds,
      })
      .getMany();

    return new Map(categories.map((category) => [category.id, category]));
  }

  async listOfferMedia(offerId: string): Promise<OfferMedia[]> {
    return this.offerMediaRepo
      .createQueryBuilder("media")
      .where("media.offerId = :offerId", { offerId })
      .orderBy("media.isCover", "DESC")
      .addOrderBy("media.sortOrder", "ASC")
      .addOrderBy("media.createdAt", "ASC")
      .getMany();
  }

  async listOfferLocations(offerId: string): Promise<OfferLocation[]> {
    return this.offerLocationsRepo.find({ where: { offerId } });
  }

  async listPartnerLocationsByIds(ids: string[]): Promise<PartnerLocation[]> {
    const uniqueLocationIds = uniqueNonEmptyIds(ids);

    if (uniqueLocationIds.length === 0) {
      return [];
    }

    return this.partnerLocationsRepo.find({
      where: { id: In(uniqueLocationIds) },
    });
  }

  async findPartnerById(partnerId: string): Promise<Partner | null> {
    return this.partnersRepo.findOne({ where: { id: partnerId } });
  }

  async findCategoryById(categoryId: string): Promise<OfferCategory | null> {
    return this.offerCategoriesRepo.findOne({ where: { id: categoryId } });
  }

  async listVisibleReviewsByOfferId(offerId: string): Promise<Review[]> {
    return this.reviewsRepo
      .createQueryBuilder("review")
      .where("review.offerId = :offerId", { offerId })
      .andWhere("review.status = :status", { status: ReviewStatus.VISIBLE })
      .orderBy("review.createdAt", "DESC")
      .take(20)
      .getMany();
  }
}
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
    return this.offerCategoriesRepo.find({
      where: { isActive: true },
      order: { sortOrder: "ASC", name: "ASC" },
    });
  }

  async findCategoryBySlug(slug: string): Promise<OfferCategory | null> {
    return this.offerCategoriesRepo.findOne({ where: { slug, isActive: true } });
  }

  async listPublishedOffers(params: ListPublishedOffersParams): Promise<[Offer[], number]> {
    const qb = this.offersRepo
      .createQueryBuilder("offer")
      .where("offer.status = :status", { status: OfferStatus.PUBLISHED });

    if (params.categoryId) {
      qb.andWhere("offer.categoryId = :categoryId", { categoryId: params.categoryId });
    }

    if (params.featuredOnly) {
      qb.andWhere("offer.isFeatured = :isFeatured", { isFeatured: true });
    }

    if (params.search) {
      qb.andWhere(
        `(LOWER(offer.title) LIKE LOWER(:search)
          OR LOWER(COALESCE(offer.shortDescription, '')) LIKE LOWER(:search)
          OR LOWER(offer.description) LIKE LOWER(:search))`,
        { search: `%${params.search}%` }
      );
    }

    qb.orderBy("offer.isFeatured", "DESC")
      .addOrderBy("offer.publishedAt", "DESC")
      .addOrderBy("offer.createdAt", "DESC")
      .skip(params.offset)
      .take(params.limit);

    return qb.getManyAndCount();
  }

  async findPublishedOfferBySlug(slug: string): Promise<Offer | null> {
    return this.offersRepo.findOne({ where: { slug, status: OfferStatus.PUBLISHED } });
  }

  async getOfferCoverMap(offerIds: string[]): Promise<Map<string, OfferMedia>> {
    if (offerIds.length === 0) return new Map<string, OfferMedia>();

    const media = await this.offerMediaRepo
      .createQueryBuilder("media")
      .where("media.offerId IN (:...offerIds)", { offerIds })
      .orderBy("media.isCover", "DESC")
      .addOrderBy("media.sortOrder", "ASC")
      .addOrderBy("media.createdAt", "ASC")
      .getMany();

    const result = new Map<string, OfferMedia>();
    for (const item of media) {
      if (!result.has(item.offerId)) result.set(item.offerId, item);
    }
    return result;
  }

  async getPartnerMap(partnerIds: string[]): Promise<Map<string, Partner>> {
    if (partnerIds.length === 0) return new Map<string, Partner>();
    const partners = await this.partnersRepo.find({ where: { id: In(partnerIds) } });
    return new Map(partners.map((partner) => [partner.id, partner]));
  }

  async getCategoryMap(categoryIds: string[]): Promise<Map<string, OfferCategory>> {
    if (categoryIds.length === 0) return new Map<string, OfferCategory>();
    const categories = await this.offerCategoriesRepo.find({ where: { id: In(categoryIds) } });
    return new Map(categories.map((category) => [category.id, category]));
  }

  async listOfferMedia(offerId: string): Promise<OfferMedia[]> {
    return this.offerMediaRepo.find({
      where: { offerId },
      order: { isCover: "DESC", sortOrder: "ASC", createdAt: "ASC" },
    });
  }

  async listOfferLocations(offerId: string): Promise<OfferLocation[]> {
    return this.offerLocationsRepo.find({ where: { offerId } });
  }

  async listPartnerLocationsByIds(ids: string[]): Promise<PartnerLocation[]> {
    if (ids.length === 0) return [];
    return this.partnerLocationsRepo.find({ where: { id: In(ids) } });
  }

  async findPartnerById(partnerId: string): Promise<Partner | null> {
    return this.partnersRepo.findOne({ where: { id: partnerId } });
  }

  async findCategoryById(categoryId: string): Promise<OfferCategory | null> {
    return this.offerCategoriesRepo.findOne({ where: { id: categoryId } });
  }

  async listVisibleReviewsByOfferId(offerId: string): Promise<Review[]> {
    return this.reviewsRepo.find({
      where: { offerId, status: ReviewStatus.VISIBLE },
      order: { createdAt: "DESC" },
      take: 20,
    });
  }
}

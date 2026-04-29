import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { OffersService } from "../../offers/services/offers.service.js";

export interface CatalogListOffersInput {
  categorySlug?: string;
  search?: string;
  featuredOnly?: boolean;
  limit: number;
  offset: number;
}

function normalizeLimit(limit: number): number {
  return Math.min(Math.max(limit, 1), 50);
}

function normalizeOffset(offset: number): number {
  return Math.max(offset, 0);
}

function uniqueNonEmptyIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function calculateAverageRating(reviews: Array<{ rating: number }>): number | null {
  if (reviews.length === 0) {
    return null;
  }

  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}

@Injectable()
export class CatalogService {
  constructor(
    @Inject(OffersService)
    private readonly offersService: OffersService
  ) {}

  async listCategories() {
    const categories = await this.offersService.listActiveCategories();

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      createdAt: category.createdAt,
    }));
  }

  async getHomeOffers() {
    const [featuredOffers, newOffers] = await Promise.all([
      this.listOffers({
        featuredOnly: true,
        limit: 6,
        offset: 0,
      }),
      this.listOffers({
        limit: 6,
        offset: 0,
      }),
    ]);

    return {
      featuredOffers: featuredOffers.items,
      newOffers: newOffers.items,
    };
  }

  async listOffers(input: CatalogListOffersInput) {
    const limit = normalizeLimit(input.limit);
    const offset = normalizeOffset(input.offset);
    const categorySlug = input.categorySlug?.trim();
    const search = input.search?.trim();

    const category = categorySlug
      ? await this.offersService.findCategoryBySlug(categorySlug)
      : null;

    if (categorySlug && !category) {
      throw new NotFoundException(`Category '${categorySlug}' not found`);
    }

    const [offers, total] = await this.offersService.listPublishedOffers({
      categoryId: category?.id,
      search: search && search.length > 0 ? search : undefined,
      featuredOnly: input.featuredOnly,
      limit,
      offset,
    });

    const offerIds = offers.map((offer) => offer.id);
    const partnerIds = uniqueNonEmptyIds(offers.map((offer) => offer.partnerId));
    const categoryIds = uniqueNonEmptyIds(
      offers.map((offer) => offer.categoryId)
    );

    const [coverMap, partnerMap, categoryMap] = await Promise.all([
      this.offersService.getOfferCoverMap(offerIds),
      this.offersService.getPartnerMap(partnerIds),
      this.offersService.getCategoryMap(categoryIds),
    ]);

    return {
      total,
      limit,
      offset,
      items: offers.map((offer) => {
        const cover = coverMap.get(offer.id) ?? null;
        const partner = partnerMap.get(offer.partnerId) ?? null;
        const offerCategory = categoryMap.get(offer.categoryId) ?? null;

        return {
          id: offer.id,
          slug: offer.slug,
          title: offer.title,
          shortDescription: offer.shortDescription,
          benefitType: offer.benefitType,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          cashbackPercent: offer.cashbackPercent,
          bonusRewardPoints: offer.bonusRewardPoints,
          minPurchaseAmount: offer.minPurchaseAmount,
          startAt: offer.startAt,
          endAt: offer.endAt,
          isFeatured: offer.isFeatured,
          publishedAt: offer.publishedAt,
          category: offerCategory
            ? {
                id: offerCategory.id,
                name: offerCategory.name,
                slug: offerCategory.slug,
              }
            : null,
          partner: partner
            ? {
                id: partner.id,
                brandName: partner.brandName,
                logoUrl: partner.logoUrl,
              }
            : null,
          coverMedia: cover
            ? {
                id: cover.id,
                mediaType: cover.mediaType,
                fileUrl: cover.fileUrl,
                isCover: cover.isCover,
              }
            : null,
        };
      }),
    };
  }

  async getOfferBySlug(slug: string) {
    const normalizedSlug = slug.trim();

    const offer = await this.offersService.findPublishedOfferBySlug(
      normalizedSlug
    );

    if (!offer) {
      throw new NotFoundException(`Published offer '${normalizedSlug}' not found`);
    }

    const [category, partner, media, offerLocations, reviews] =
      await Promise.all([
        this.offersService.findCategoryById(offer.categoryId),
        this.offersService.findPartnerById(offer.partnerId),
        this.offersService.listOfferMedia(offer.id),
        this.offersService.listOfferLocations(offer.id),
        this.offersService.listVisibleReviewsByOfferId(offer.id),
      ]);

    const locationIds = uniqueNonEmptyIds(
      offerLocations.map((item) => item.locationId)
    );

    const locations = await this.offersService.listPartnerLocationsByIds(
      locationIds
    );

    const averageRating = calculateAverageRating(reviews);

    return {
      id: offer.id,
      slug: offer.slug,
      title: offer.title,
      shortDescription: offer.shortDescription,
      description: offer.description,
      benefitType: offer.benefitType,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      cashbackPercent: offer.cashbackPercent,
      bonusRewardPoints: offer.bonusRewardPoints,
      minPurchaseAmount: offer.minPurchaseAmount,
      terms: offer.terms,
      usageLimitPerUser: offer.usageLimitPerUser,
      totalUsageLimit: offer.totalUsageLimit,
      startAt: offer.startAt,
      endAt: offer.endAt,
      isFeatured: offer.isFeatured,
      publishedAt: offer.publishedAt,
      category: category
        ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
          }
        : null,
      partner: partner
        ? {
            id: partner.id,
            brandName: partner.brandName,
            description: partner.description,
            contactEmail: partner.contactEmail,
            contactPhone: partner.contactPhone,
            websiteUrl: partner.websiteUrl,
            instagramUrl: partner.instagramUrl,
            logoUrl: partner.logoUrl,
          }
        : null,
      media: media.map((item) => ({
        id: item.id,
        mediaType: item.mediaType,
        fileUrl: item.fileUrl,
        sortOrder: item.sortOrder,
        isCover: item.isCover,
      })),
      locations: locations.map((location) => ({
        id: location.id,
        name: location.name,
        city: location.city,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        isActive: location.isActive,
      })),
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
      })),
      stats: {
        reviewCount: reviews.length,
        averageRating,
      },
    };
  }
}
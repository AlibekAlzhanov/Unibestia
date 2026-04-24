import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { OffersService } from "../../offers/services/offers.service.js";

export interface CatalogListOffersInput {
  categorySlug?: string;
  search?: string;
  featuredOnly?: boolean;
  limit: number;
  offset: number;
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

  async listOffers(input: CatalogListOffersInput) {
    const category = input.categorySlug
      ? await this.offersService.findCategoryBySlug(input.categorySlug)
      : null;

    if (input.categorySlug && !category) {
      throw new NotFoundException(
        `Category '${input.categorySlug}' not found`
      );
    }

    const [offers, total] = await this.offersService.listPublishedOffers({
      categoryId: category?.id,
      search: input.search,
      featuredOnly: input.featuredOnly,
      limit: input.limit,
      offset: input.offset,
    });

    const offerIds = offers.map((offer) => offer.id);
    const partnerIds = [...new Set(offers.map((offer) => offer.partnerId))];
    const categoryIds = [...new Set(offers.map((offer) => offer.categoryId))];

    const coverMap = await this.offersService.getOfferCoverMap(offerIds);
    const partnerMap = await this.offersService.getPartnerMap(partnerIds);
    const categoryMap = await this.offersService.getCategoryMap(categoryIds);

    return {
      total,
      limit: input.limit,
      offset: input.offset,
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
    const offer = await this.offersService.findPublishedOfferBySlug(slug);

    if (!offer) {
      throw new NotFoundException(`Published offer '${slug}' not found`);
    }

    const [category, partner, media, offerLocations, reviews] =
      await Promise.all([
        this.offersService.findCategoryById(offer.categoryId),
        this.offersService.findPartnerById(offer.partnerId),
        this.offersService.listOfferMedia(offer.id),
        this.offersService.listOfferLocations(offer.id),
        this.offersService.listVisibleReviewsByOfferId(offer.id),
      ]);

    const locations = await this.offersService.listPartnerLocationsByIds(
      offerLocations.map((item) => item.locationId)
    );

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : null;

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

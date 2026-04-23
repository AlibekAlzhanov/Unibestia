import { Injectable } from "@nestjs/common";
import {
  OffersRepository,
  type ListPublishedOffersParams,
} from "../repositories/offers.repository.js";

@Injectable()
export class OffersService {
  constructor(private readonly offersRepository: OffersRepository) {}

  async listActiveCategories() {
    return this.offersRepository.listActiveCategories();
  }

  async findCategoryBySlug(slug: string) {
    return this.offersRepository.findCategoryBySlug(slug);
  }

  async listPublishedOffers(params: ListPublishedOffersParams) {
    return this.offersRepository.listPublishedOffers(params);
  }

  async findPublishedOfferBySlug(slug: string) {
    return this.offersRepository.findPublishedOfferBySlug(slug);
  }

  async getOfferCoverMap(offerIds: string[]) {
    return this.offersRepository.getOfferCoverMap(offerIds);
  }

  async getPartnerMap(partnerIds: string[]) {
    return this.offersRepository.getPartnerMap(partnerIds);
  }

  async getCategoryMap(categoryIds: string[]) {
    return this.offersRepository.getCategoryMap(categoryIds);
  }

  async listOfferMedia(offerId: string) {
    return this.offersRepository.listOfferMedia(offerId);
  }

  async listOfferLocations(offerId: string) {
    return this.offersRepository.listOfferLocations(offerId);
  }

  async listPartnerLocationsByIds(ids: string[]) {
    return this.offersRepository.listPartnerLocationsByIds(ids);
  }

  async findPartnerById(partnerId: string) {
    return this.offersRepository.findPartnerById(partnerId);
  }

  async findCategoryById(categoryId: string) {
    return this.offersRepository.findCategoryById(categoryId);
  }

  async listVisibleReviewsByOfferId(offerId: string) {
    return this.offersRepository.listVisibleReviewsByOfferId(offerId);
  }
}

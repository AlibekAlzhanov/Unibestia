import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Offer,
  OfferCategory,
  OfferLocation,
  OfferMedia,
  Partner,
  PartnerLocation,
  Review,
} from "@repo/db";
import { OffersRepository } from "./repositories/offers.repository.js";
import { OffersService } from "./services/offers.service.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Offer,
      OfferCategory,
      OfferMedia,
      OfferLocation,
      Partner,
      PartnerLocation,
      Review,
    ]),
  ],
  providers: [OffersRepository, OffersService],
  exports: [OffersRepository, OffersService],
})
export class OffersModule {}

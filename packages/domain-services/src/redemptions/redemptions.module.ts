import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Offer,
  OfferLocation,
  PartnerLocation,
  Redemption,
  StudentProfile,
} from "@repo/db";
import { RedemptionsRepository } from "./repositories/redemptions.repository.js";
import { RedemptionsService } from "./services/redemptions.service.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Redemption,
      Offer,
      StudentProfile,
      OfferLocation,
      PartnerLocation,
    ]),
  ],
  providers: [RedemptionsRepository, RedemptionsService],
  exports: [RedemptionsRepository, RedemptionsService],
})
export class RedemptionsModule {}

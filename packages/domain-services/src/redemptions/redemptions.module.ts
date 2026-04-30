import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AuditLog,
  Offer,
  OfferLocation,
  Partner,
  PartnerLocation,
  Redemption,
  StudentProfile,
  User,
} from "@repo/db";
import { WalletsModule } from "../wallets/wallets.module.js";
import { RedemptionsRepository } from "./repositories/redemptions.repository.js";
import { RedemptionsService } from "./services/redemptions.service.js";

@Module({
  imports: [
    WalletsModule,
    TypeOrmModule.forFeature([
      AuditLog,
      Redemption,
      Offer,
      StudentProfile,
      OfferLocation,
      PartnerLocation,
      User,
      Partner,
    ]),
  ],
  providers: [RedemptionsRepository, RedemptionsService],
  exports: [RedemptionsRepository, RedemptionsService],
})
export class RedemptionsModule {}
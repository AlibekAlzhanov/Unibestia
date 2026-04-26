import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Offer,
  OfferMedia,
  Partner,
  PartnerMember,
  User,
} from "@repo/db";
import { StorageModule } from "../storage/storage.module.js";
import { MediaUploadsController } from "./media-uploads.controller.js";

@Module({
  imports: [
    StorageModule,
    TypeOrmModule.forFeature([
      User,
      Partner,
      PartnerMember,
      Offer,
      OfferMedia,
    ]),
  ],
  controllers: [MediaUploadsController],
})
export class MediaUploadsModule {}

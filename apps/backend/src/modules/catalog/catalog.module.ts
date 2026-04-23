import { Module } from "@nestjs/common";
import { OffersModule } from "../offers/offers.module.js";
import { CatalogService } from "./services/catalog.service.js";

@Module({
  imports: [OffersModule],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}

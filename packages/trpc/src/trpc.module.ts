import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostHogModule } from "@repo/analytics";
import {
  Offer,
  OfferCategory,
  OfferLocation,
  Partner,
  PartnerLocation,
  PartnerMember,
  Redemption,
  Role,
  StudentProfile,
  StudentVerification,
  University,
  User,
  UserRole,
} from "@repo/db";
import {
  CatalogModule,
  RedemptionsModule,
  WalletsModule,
} from "@repo/domain-services";
import { AuthService } from "@repo/services";
import { TRPCService } from "./trpc.service.js";
import { TRPCPanelController } from "./trpc-panel.controller.js";
import { AppRouterClass } from "./routers/index.js";
import { AuthRouter } from "./routers/routers/auth.router.js";
import { BusinessRouter } from "./routers/routers/business.router.js";
import { CatalogRouter } from "./routers/routers/catalog.router.js";
import { ProfileRouter } from "./routers/routers/profile.router.js";
import { RedemptionsRouter } from "./routers/routers/redemptions.router.js";
import { WalletRouter } from "./routers/routers/wallet.router.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PostHogModule,
    CatalogModule,
    WalletsModule,
    RedemptionsModule,
    TypeOrmModule.forFeature([
      User,
      UserRole,
      Role,
      StudentProfile,
      StudentVerification,
      University,
      Partner,
      PartnerLocation,
      PartnerMember,
      Offer,
      OfferCategory,
      OfferLocation,
      Redemption,
    ]),
  ],
  providers: [
    TRPCService,
    AppRouterClass,
    AuthRouter,
    ProfileRouter,
    CatalogRouter,
    WalletRouter,
    RedemptionsRouter,
    BusinessRouter,
    AuthService,
  ],
  exports: [TRPCService],
  controllers: [TRPCPanelController],
})
export class TRPCModule {}

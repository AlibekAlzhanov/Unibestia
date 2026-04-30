import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostHogModule } from "@repo/analytics";
import {
  AuditLog,
  FavoriteOffer,
  ModerationTask,
  Notification,
  Offer,
  OfferCategory,
  OfferLocation,
  Partner,
  PartnerLocation,
  PartnerMember,
  Redemption,
  ReferralCode,
  ReferralReward,
  Review,
  Role,
  StudentProfile,
  StudentVerification,
  University,
  UniversityEmailDomain,
  User,
  UserRole,
  Wallet,
  WalletTransaction,
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
import { AdminStudentVerificationsRouter } from "./routers/routers/admin-student-verifications.router.js";
import { AuthRouter } from "./routers/routers/auth.router.js";
import { BusinessRouter } from "./routers/routers/business.router.js";
import { CatalogRouter } from "./routers/routers/catalog.router.js";
import { NotificationsRouter } from "./routers/routers/notifications.router.js";
import { ProfileRouter } from "./routers/routers/profile.router.js";
import { RedemptionsRouter } from "./routers/routers/redemptions.router.js";
import { ReferralsRouter } from "./routers/routers/referrals.router.js";
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
      AuditLog,
      FavoriteOffer,
      ModerationTask,
      Notification,
      User,
      UserRole,
      Role,
      StudentProfile,
      StudentVerification,
      University,
      UniversityEmailDomain,
      Partner,
      PartnerLocation,
      PartnerMember,
      Offer,
      OfferCategory,
      OfferLocation,
      Redemption,
      ReferralCode,
      ReferralReward,
      Review,
      Wallet,
      WalletTransaction,
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
    NotificationsRouter,
    ReferralsRouter,
    AdminStudentVerificationsRouter,
    AuthService,
  ],
  exports: [TRPCService],
  controllers: [TRPCPanelController],
})
export class TRPCModule {}

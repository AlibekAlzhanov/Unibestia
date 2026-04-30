import { Module } from "@nestjs/common";
import { DatabaseModule } from "@repo/db";
import {
  CatalogModule,
  RedemptionsModule,
  WalletsModule,
} from "@repo/domain-services";
import { PostHogModule } from "@repo/analytics";
import { AuthModule, RedisModule, WebhooksModule } from "@repo/services";
import { TRPCModule, TRPCPanelController } from "@repo/trpc";
import { WebsocketsModule } from "@repo/websockets/server";
import { AppConfigModule } from "./config/app-config.module.js";
import { HealthModule } from "./health/health.module.js";
import { MediaUploadsModule } from "./media/media-uploads.module.js";
import { StudentVerificationDocumentsModule } from "./student-verifications/student-verification-documents.module.js";

@Module({
  imports: [
    AppConfigModule,
    TRPCModule,
    DatabaseModule.forRoot(),
    RedisModule,
    PostHogModule,
    AuthModule,
    CatalogModule,
    WalletsModule,
    RedemptionsModule,
    WebsocketsModule,
    WebhooksModule,
    HealthModule,
    StudentVerificationDocumentsModule,
    MediaUploadsModule,
  ],
  controllers: [TRPCPanelController],
  providers: [],
})
export class AppModule {}
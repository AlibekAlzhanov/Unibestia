import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "@repo/db";
import {
  CatalogModule,
  RedemptionsModule,
  WalletsModule,
} from "@repo/domain-services";
import { AuthModule, RedisModule, WebhooksModule } from "@repo/services";
import { AppConfigModule } from "./config/app-config.module.js";

import { TRPCModule, TRPCPanelController } from "@repo/trpc";
import { PostHogModule } from "@repo/analytics";
import { WebsocketsModule } from "@repo/websockets/server";
import { HealthModule } from "./health/health.module.js";
import { StudentVerificationDocumentsModule } from "./student-verifications/student-verification-documents.module.js";
import { MediaUploadsModule } from "./media/media-uploads.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TRPCModule,
    DatabaseModule.forRoot(),
    RedisModule,
    PostHogModule,
    AppConfigModule,
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

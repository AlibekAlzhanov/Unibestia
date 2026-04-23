import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostHogModule } from "@repo/analytics";
import {
  Role,
  StudentProfile,
  StudentVerification,
  University,
  User,
  UserRole,
} from "@repo/db";
import { CatalogModule } from "@repo/domain-services";
import { AuthService } from "@repo/services";
import { TRPCService } from "./trpc.service.js";
import { TRPCPanelController } from "./trpc-panel.controller.js";
import { AppRouterClass } from "./routers/index.js";
import { BasicRouter } from "./routers/routers/basic.router.js";
import { AuthRouter } from "./routers/routers/auth.router.js";
import { CatalogRouter } from "./routers/routers/catalog.router.js";
import { ChatRoomRouter } from "./routers/routers/chatroom.router.js";
import { ProfileRouter } from "./routers/routers/profile.router.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PostHogModule,
    CatalogModule,
    TypeOrmModule.forFeature([
      User,
      UserRole,
      Role,
      StudentProfile,
      StudentVerification,
      University,
    ]),
  ],
  providers: [
    TRPCService,
    AppRouterClass,
    BasicRouter,
    AuthRouter,
    ProfileRouter,
    CatalogRouter,
    ChatRoomRouter,
    AuthService,
  ],
  exports: [TRPCService],
  controllers: [TRPCPanelController],
})
export class TRPCModule {}

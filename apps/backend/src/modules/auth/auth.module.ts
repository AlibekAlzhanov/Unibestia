import { Module } from "@nestjs/common";
import { AuthModule as ExternalAuthModule } from "@repo/services";
import { UsersModule } from "../users/users.module.js";
import { RolesModule } from "../roles/roles.module.js";
import { UniAuthService } from "./services/auth.service.js";

@Module({
  imports: [ExternalAuthModule, UsersModule, RolesModule],
  providers: [UniAuthService],
  exports: [UniAuthService],
})
export class UniAuthModule {}

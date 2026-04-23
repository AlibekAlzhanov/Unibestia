import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role, UserRole } from "@repo/db";
import { RolesRepository } from "./repositories/roles.repository.js";
import { RolesService } from "./services/roles.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([Role, UserRole])],
  providers: [RolesRepository, RolesService],
  exports: [RolesRepository, RolesService],
})
export class RolesModule {}

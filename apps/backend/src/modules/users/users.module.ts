import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role, User, UserRole } from "@repo/db";
import { UsersRepository } from "./repositories/users.repository.js";
import { UsersService } from "./services/users.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, Role])],
  providers: [UsersRepository, UsersService],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}

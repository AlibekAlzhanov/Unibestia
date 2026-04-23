import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Wallet, WalletTransaction } from "@repo/db";
import { WalletsRepository } from "./repositories/wallets.repository.js";
import { WalletsService } from "./services/wallets.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletTransaction])],
  providers: [WalletsRepository, WalletsService],
  exports: [WalletsRepository, WalletsService],
})
export class WalletsModule {}

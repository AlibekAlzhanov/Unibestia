import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Wallet } from "./wallet.entity.js";
import { User } from "../auth/user.entity.js";

export enum WalletTransactionType {
  EARN = "earn",
  SPEND = "spend",
  EXPIRE = "expire",
  ADJUSTMENT = "adjustment",
  REFUND = "refund",
}

export enum WalletTransactionSourceType {
  REDEMPTION = "redemption",
  REFERRAL = "referral",
  ADMIN = "admin",
  PROMOTION = "promotion",
  MANUAL = "manual",
}

@Entity("wallet_transactions")
export class WalletTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_wallet_transactions_wallet_id")
  @Column("uuid", { name: "wallet_id" })
  walletId: string;

  @Index("idx_wallet_transactions_user_id")
  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column({
    type: "enum",
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

  @Index("idx_wallet_transactions_source_type_source_id")
  @Column({
    name: "source_type",
    type: "enum",
    enum: WalletTransactionSourceType,
  })
  sourceType: WalletTransactionSourceType;

  @Index("idx_wallet_transactions_source_id")
  @Column("uuid", { name: "source_id", nullable: true })
  sourceId: string | null;

  @Column("integer", { name: "points_delta" })
  pointsDelta: number;

  @Column("integer", { name: "balance_after" })
  balanceAfter: number;

  @Column("timestamptz", { name: "expires_at", nullable: true })
  expiresAt: Date | null;

  @Column("text", { nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "wallet_id" })
  wallet: Wallet;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}

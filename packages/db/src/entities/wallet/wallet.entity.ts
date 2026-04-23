import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Check,
} from "typeorm";
import { User } from "../auth/user.entity.js";
import { WalletTransaction } from "./wallet-transaction.entity.js";

@Entity("wallets")
@Check(`"available_balance" >= 0`)
@Check(`"lifetime_earned" >= 0`)
@Check(`"lifetime_spent" >= 0`)
export class Wallet {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "user_id", unique: true })
  userId: string;

  @Column("integer", { name: "available_balance", default: 0 })
  availableBalance: number;

  @Column("integer", { name: "lifetime_earned", default: 0 })
  lifetimeEarned: number;

  @Column("integer", { name: "lifetime_spent", default: 0 })
  lifetimeSpent: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.wallet, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => WalletTransaction, (walletTransaction) => walletTransaction.wallet)
  transactions: WalletTransaction[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "../auth/user.entity.js";
import { ReferralReward } from "./referral-reward.entity.js";

@Entity("referral_codes")
export class ReferralCode {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "user_id", unique: true })
  userId: string;

  @Column("varchar", { length: 50, unique: true })
  code: string;

  @Column("boolean", { name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @OneToOne(() => User, (user) => user.referralCode, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => ReferralReward, (referralReward) => referralReward.referralCode)
  rewards: ReferralReward[];
}

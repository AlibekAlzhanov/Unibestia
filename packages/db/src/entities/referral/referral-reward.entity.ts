import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "../auth/user.entity.js";
import { ReferralCode } from "./referral-code.entity.js";

export enum ReferralRewardStatus {
  REGISTERED = "registered",
  VERIFIED = "verified",
  REWARDED = "rewarded",
  CANCELLED = "cancelled",
}

@Entity("referral_rewards")
@Unique("uq_referral_rewards_referred_user_id", ["referredUserId"])
export class ReferralReward {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "referrer_user_id" })
  referrerUserId: string;

  @Column("uuid", { name: "referred_user_id" })
  referredUserId: string;

  @Column("uuid", { name: "referral_code_id" })
  referralCodeId: string;

  @Column({
    type: "enum",
    enum: ReferralRewardStatus,
    default: ReferralRewardStatus.REGISTERED,
  })
  status: ReferralRewardStatus;

  @Column("integer", { name: "referrer_reward_points", default: 0 })
  referrerRewardPoints: number;

  @Column("integer", { name: "referred_reward_points", default: 0 })
  referredRewardPoints: number;

  @Column("timestamptz", { name: "rewarded_at", nullable: true })
  rewardedAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.referralRewardsAsReferrer, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "referrer_user_id" })
  referrerUser: User;

  @ManyToOne(() => User, (user) => user.referralRewardsAsReferred, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "referred_user_id" })
  referredUser: User;

  @ManyToOne(() => ReferralCode, (referralCode) => referralCode.rewards, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "referral_code_id" })
  referralCode: ReferralCode;
}

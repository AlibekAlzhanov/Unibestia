import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from "typeorm";
import { UserRole } from "./user-role.entity.js";
import { StudentProfile } from "../student/student-profile.entity.js";
import { StudentVerification } from "../student/student-verification.entity.js";
import { PartnerMember } from "../partner/partner-member.entity.js";
import { Partner } from "../partner/partner.entity.js";
import { Offer } from "../offer/offer.entity.js";
import { Wallet } from "../wallet/wallet.entity.js";
import { ReferralCode } from "../referral/referral-code.entity.js";
import { ReferralReward } from "../referral/referral-reward.entity.js";
import { Redemption } from "../redemption/redemption.entity.js";
import { Review } from "../review/review.entity.js";
import { Notification } from "../notification/notification.entity.js";
import { ModerationTask } from "../moderation/moderation-task.entity.js";
import { AuditLog } from "../audit/audit-log.entity.js";

export enum UserStatus {
  ACTIVE = "active",
  BLOCKED = "blocked",
  PENDING = "pending",
  DISABLED = "disabled",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_users_clerk_user_id", { unique: true })
  @Column("varchar", { name: "clerk_user_id", length: 255, unique: true })
  clerkUserId: string;

  @Index("idx_users_email", { unique: true })
  @Column("citext", { unique: true })
  email: string;

  @Column("varchar", { name: "first_name", length: 100, nullable: true })
  firstName: string | null;

  @Column("varchar", { name: "last_name", length: 100, nullable: true })
  lastName: string | null;

  @Column("varchar", { name: "display_name", length: 150, nullable: true })
  displayName: string | null;

  @Column("varchar", { length: 30, nullable: true })
  phone: string | null;

  @Column("text", { name: "avatar_url", nullable: true })
  avatarUrl: string | null;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column("timestamptz", { name: "last_login_at", nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToOne(() => StudentProfile, (studentProfile) => studentProfile.user)
  studentProfile: StudentProfile;

  @OneToMany(() => StudentVerification, (studentVerification) => studentVerification.user)
  studentVerifications: StudentVerification[];

  @OneToMany(() => StudentVerification, (studentVerification) => studentVerification.reviewedBy)
  reviewedStudentVerifications: StudentVerification[];

  @OneToMany(() => PartnerMember, (partnerMember) => partnerMember.user)
  partnerMemberships: PartnerMember[];

  @OneToMany(() => Partner, (partner) => partner.createdByUser)
  createdPartners: Partner[];

  @OneToMany(() => Partner, (partner) => partner.approvedByUser)
  approvedPartners: Partner[];

  @OneToMany(() => Offer, (offer) => offer.createdByUser)
  createdOffers: Offer[];

  @OneToMany(() => Offer, (offer) => offer.updatedByUser)
  updatedOffers: Offer[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToOne(() => ReferralCode, (referralCode) => referralCode.user)
  referralCode: ReferralCode;

  @OneToMany(() => ReferralReward, (referralReward) => referralReward.referrerUser)
  referralRewardsAsReferrer: ReferralReward[];

  @OneToMany(() => ReferralReward, (referralReward) => referralReward.referredUser)
  referralRewardsAsReferred: ReferralReward[];

  @OneToMany(() => Redemption, (redemption) => redemption.user)
  redemptions: Redemption[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Review, (review) => review.moderatedByUser)
  moderatedReviews: Review[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => ModerationTask, (moderationTask) => moderationTask.assignedAdminUser)
  assignedModerationTasks: ModerationTask[];

  @OneToMany(() => ModerationTask, (moderationTask) => moderationTask.resolvedByUser)
  resolvedModerationTasks: ModerationTask[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.actorUser)
  auditLogs: AuditLog[];
}

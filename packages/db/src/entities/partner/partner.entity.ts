import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../auth/user.entity.js";
import { PartnerMember } from "./partner-member.entity.js";
import { PartnerLocation } from "./partner-location.entity.js";
import { Offer } from "../offer/offer.entity.js";
import { Redemption } from "../redemption/redemption.entity.js";
import { AuditLog } from "../audit/audit-log.entity.js";

export enum PartnerStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
  ARCHIVED = "archived",
}

@Entity("partners")
export class Partner {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { name: "legal_name", length: 255 })
  legalName: string;

  @Column("varchar", { name: "brand_name", length: 255 })
  brandName: string;

  @Column("text", { nullable: true })
  description: string | null;

  @Column("citext", { name: "contact_email" })
  contactEmail: string;

  @Column("varchar", { name: "contact_phone", length: 30, nullable: true })
  contactPhone: string | null;

  @Column("text", { name: "website_url", nullable: true })
  websiteUrl: string | null;

  @Column("text", { name: "instagram_url", nullable: true })
  instagramUrl: string | null;

  @Column("text", { name: "logo_url", nullable: true })
  logoUrl: string | null;

  @Index("idx_partners_status")
  @Column({
    type: "enum",
    enum: PartnerStatus,
    default: PartnerStatus.PENDING,
  })
  status: PartnerStatus;

  @Column("uuid", { name: "created_by_user_id" })
  createdByUserId: string;

  @Column("uuid", { name: "approved_by_user_id", nullable: true })
  approvedByUserId: string | null;

  @Column("timestamptz", { name: "approved_at", nullable: true })
  approvedAt: Date | null;

  @Column("text", { name: "rejection_reason", nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.createdPartners, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "created_by_user_id" })
  createdByUser: User;

  @ManyToOne(() => User, (user) => user.approvedPartners, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "approved_by_user_id" })
  approvedByUser: User | null;

  @OneToMany(() => PartnerMember, (partnerMember) => partnerMember.partner)
  members: PartnerMember[];

  @OneToMany(() => PartnerLocation, (partnerLocation) => partnerLocation.partner)
  locations: PartnerLocation[];

  @OneToMany(() => Offer, (offer) => offer.partner)
  offers: Offer[];

  @OneToMany(() => Redemption, (redemption) => redemption.partner)
  redemptions: Redemption[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.partner)
  auditLogs: AuditLog[];
}

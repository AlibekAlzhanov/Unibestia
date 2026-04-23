import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { Partner } from "./partner.entity.js";
import { User } from "../auth/user.entity.js";

export enum PartnerMemberRole {
  OWNER = "owner",
  MANAGER = "manager",
  STAFF = "staff",
  ANALYST = "analyst",
}

@Entity("partner_members")
@Unique("uq_partner_members_partner_id_user_id", ["partnerId", "userId"])
export class PartnerMember {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_partner_members_partner_id")
  @Column("uuid", { name: "partner_id" })
  partnerId: string;

  @Index("idx_partner_members_user_id")
  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column({
    name: "member_role",
    type: "enum",
    enum: PartnerMemberRole,
  })
  memberRole: PartnerMemberRole;

  @Column("boolean", { name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => Partner, (partner) => partner.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "partner_id" })
  partner: Partner;

  @ManyToOne(() => User, (user) => user.partnerMemberships, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
  Check,
} from "typeorm";
import { User } from "../auth/user.entity.js";
import { Offer } from "../offer/offer.entity.js";
import { Partner } from "../partner/partner.entity.js";
import { PartnerLocation } from "../partner/partner-location.entity.js";
import { Review } from "../review/review.entity.js";

export enum RedemptionStatus {
  CREATED = "created",
  CONFIRMED = "confirmed",
  USED = "used",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

@Index("idx_redemptions_partner_status", ["partnerId", "status"])
@Index("idx_redemptions_partner_created", ["partnerId", "createdAt"])
@Entity("redemptions")
@Check(`"order_amount" IS NULL OR "order_amount" >= 0`)
@Check(`"discount_amount" IS NULL OR "discount_amount" >= 0`)
@Check(`"bonus_earned" >= 0`)
@Check(`"bonus_spent" >= 0`)
export class Redemption {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_redemptions_user_id")
  @Column("uuid", { name: "user_id" })
  userId: string;

  @Index("idx_redemptions_offer_id")
  @Column("uuid", { name: "offer_id" })
  offerId: string;

  @Index("idx_redemptions_partner_id")
  @Column("uuid", { name: "partner_id" })
  partnerId: string;

  @Column("uuid", { name: "location_id", nullable: true })
  locationId: string | null;

  @Index("idx_redemptions_status")
  @Column({
    type: "enum",
    enum: RedemptionStatus,
    default: RedemptionStatus.CREATED,
  })
  status: RedemptionStatus;

  @Column("varchar", { name: "qr_token", length: 255, unique: true })
  qrToken: string;

  @Column("timestamptz", { name: "qr_expires_at", nullable: true })
  qrExpiresAt: Date | null;

  @Column("numeric", {
    name: "order_amount",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  orderAmount: string | null;

  @Column("numeric", {
    name: "discount_amount",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  discountAmount: string | null;

  @Column("integer", { name: "bonus_earned", default: 0 })
  bonusEarned: number;

  @Column("integer", { name: "bonus_spent", default: 0 })
  bonusSpent: number;

  @Column("timestamptz", { name: "used_at", nullable: true })
  usedAt: Date | null;

  @Column("timestamptz", { name: "cancelled_at", nullable: true })
  cancelledAt: Date | null;

  @Index("idx_redemptions_created_at")
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.redemptions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Offer, (offer) => offer.redemptions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "offer_id" })
  offer: Offer;

  @ManyToOne(() => Partner, (partner) => partner.redemptions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "partner_id" })
  partner: Partner;

  @ManyToOne(() => PartnerLocation, (location) => location.redemptions, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "location_id" })
  location: PartnerLocation | null;

  @OneToOne(() => Review, (review) => review.redemption)
  review: Review;
}
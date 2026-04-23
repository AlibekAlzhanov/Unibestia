import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  Check,
} from "typeorm";
import { Partner } from "../partner/partner.entity.js";
import { OfferCategory } from "./offer-category.entity.js";
import { User } from "../auth/user.entity.js";
import { OfferMedia } from "./offer-media.entity.js";
import { OfferLocation } from "./offer-location.entity.js";
import { Redemption } from "../redemption/redemption.entity.js";
import { Review } from "../review/review.entity.js";

export enum OfferBenefitType {
  DISCOUNT = "discount",
  BONUS = "bonus",
  CASHBACK = "cashback",
  MIXED = "mixed",
}

export enum OfferDiscountType {
  PERCENT = "percent",
  FIXED_AMOUNT = "fixed_amount",
}

export enum OfferStatus {
  DRAFT = "draft",
  PENDING_REVIEW = "pending_review",
  APPROVED = "approved",
  PUBLISHED = "published",
  REJECTED = "rejected",
  ARCHIVED = "archived",
}

@Entity("offers")
@Check(`"discount_value" IS NULL OR "discount_value" >= 0`)
@Check(`"cashback_percent" IS NULL OR ("cashback_percent" >= 0 AND "cashback_percent" <= 100)`)
@Check(`"bonus_reward_points" IS NULL OR "bonus_reward_points" >= 0`)
@Check(`"min_purchase_amount" IS NULL OR "min_purchase_amount" >= 0`)
export class Offer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_offers_partner_id")
  @Column("uuid", { name: "partner_id" })
  partnerId: string;

  @Index("idx_offers_category_id")
  @Column("uuid", { name: "category_id" })
  categoryId: string;

  @Column("varchar", { length: 255 })
  title: string;

  @Column("varchar", { length: 255, unique: true })
  slug: string;

  @Column("varchar", { name: "short_description", length: 500, nullable: true })
  shortDescription: string | null;

  @Column("text")
  description: string;

  @Column({
    name: "benefit_type",
    type: "enum",
    enum: OfferBenefitType,
  })
  benefitType: OfferBenefitType;

  @Column({
    name: "discount_type",
    type: "enum",
    enum: OfferDiscountType,
    nullable: true,
  })
  discountType: OfferDiscountType | null;

  @Column("numeric", {
    name: "discount_value",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  discountValue: string | null;

  @Column("numeric", {
    name: "cashback_percent",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  cashbackPercent: string | null;

  @Column("integer", { name: "bonus_reward_points", nullable: true })
  bonusRewardPoints: number | null;

  @Column("numeric", {
    name: "min_purchase_amount",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  minPurchaseAmount: string | null;

  @Column("text", { nullable: true })
  terms: string | null;

  @Column("integer", { name: "usage_limit_per_user", nullable: true })
  usageLimitPerUser: number | null;

  @Column("integer", { name: "total_usage_limit", nullable: true })
  totalUsageLimit: number | null;

  @Index("idx_offers_start_at")
  @Column("timestamptz", { name: "start_at" })
  startAt: Date;

  @Index("idx_offers_end_at")
  @Column("timestamptz", { name: "end_at", nullable: true })
  endAt: Date | null;

  @Index("idx_offers_status")
  @Column({
    type: "enum",
    enum: OfferStatus,
    default: OfferStatus.DRAFT,
  })
  status: OfferStatus;

  @Column("boolean", { name: "is_featured", default: false })
  isFeatured: boolean;

  @Index("idx_offers_published_at")
  @Column("timestamptz", { name: "published_at", nullable: true })
  publishedAt: Date | null;

  @Column("uuid", { name: "created_by_user_id" })
  createdByUserId: string;

  @Column("uuid", { name: "updated_by_user_id", nullable: true })
  updatedByUserId: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Partner, (partner) => partner.offers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "partner_id" })
  partner: Partner;

  @ManyToOne(() => OfferCategory, (offerCategory) => offerCategory.offers, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "category_id" })
  category: OfferCategory;

  @ManyToOne(() => User, (user) => user.createdOffers, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "created_by_user_id" })
  createdByUser: User;

  @ManyToOne(() => User, (user) => user.updatedOffers, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "updated_by_user_id" })
  updatedByUser: User | null;

  @OneToMany(() => OfferMedia, (offerMedia) => offerMedia.offer)
  mediaItems: OfferMedia[];

  @OneToMany(() => OfferLocation, (offerLocation) => offerLocation.offer)
  offerLocations: OfferLocation[];

  @OneToMany(() => Redemption, (redemption) => redemption.offer)
  redemptions: Redemption[];

  @OneToMany(() => Review, (review) => review.offer)
  reviews: Review[];
}

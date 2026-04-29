import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Check,
  Index,
} from "typeorm";
import { User } from "../auth/user.entity.js";
import { Offer } from "../offer/offer.entity.js";
import { Redemption } from "../redemption/redemption.entity.js";

export enum ReviewStatus {
  VISIBLE = "visible",
  HIDDEN = "hidden",
  PENDING_MODERATION = "pending_moderation",
  REJECTED = "rejected",
}

@Index("idx_reviews_offer_status_created", ["offerId", "status", "createdAt"])
@Entity("reviews")
@Check(`"rating" >= 1 AND "rating" <= 5`)
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Index("idx_reviews_offer_id")
  @Column("uuid", { name: "offer_id" })
  offerId: string;

  @Column("uuid", { name: "redemption_id", unique: true })
  redemptionId: string;

  @Column("smallint")
  rating: number;

  @Column("text", { nullable: true })
  text: string | null;

  @Index("idx_reviews_status")
  @Column({
    type: "enum",
    enum: ReviewStatus,
    default: ReviewStatus.VISIBLE,
  })
  status: ReviewStatus;

  @Column("uuid", { name: "moderated_by_user_id", nullable: true })
  moderatedByUserId: string | null;

  @Column("timestamptz", { name: "moderated_at", nullable: true })
  moderatedAt: Date | null;

  @Column("text", { name: "moderation_comment", nullable: true })
  moderationComment: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Offer, (offer) => offer.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "offer_id" })
  offer: Offer;

  @OneToOne(() => Redemption, (redemption) => redemption.review, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "redemption_id" })
  redemption: Redemption;

  @ManyToOne(() => User, (user) => user.moderatedReviews, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "moderated_by_user_id" })
  moderatedByUser: User | null;
}
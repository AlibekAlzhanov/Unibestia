import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { User } from "../auth/user.entity.js";
import { Offer } from "./offer.entity.js";

@Entity("favorite_offers")
@Unique("uq_favorite_offers_user_id_offer_id", ["userId", "offerId"])
export class FavoriteOffer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_favorite_offers_user_id")
  @Column("uuid", { name: "user_id" })
  userId: string;

  @Index("idx_favorite_offers_offer_id")
  @Column("uuid", { name: "offer_id" })
  offerId: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Offer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "offer_id" })
  offer: Offer;
}

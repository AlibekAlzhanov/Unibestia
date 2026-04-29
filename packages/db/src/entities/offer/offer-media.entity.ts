import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Offer } from "./offer.entity.js";

export enum OfferMediaType {
  IMAGE = "image",
  BANNER = "banner",
}

@Index("idx_offer_media_offer_id", ["offerId"])
@Index("idx_offer_media_offer_cover_sort", [
  "offerId",
  "isCover",
  "sortOrder",
  "createdAt",
])
@Entity("offer_media")
export class OfferMedia {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "offer_id" })
  offerId: string;

  @Column({
    name: "media_type",
    type: "enum",
    enum: OfferMediaType,
  })
  mediaType: OfferMediaType;

  @Column("text", { name: "file_url" })
  fileUrl: string;

  @Column("integer", { name: "sort_order", default: 0 })
  sortOrder: number;

  @Column("boolean", { name: "is_cover", default: false })
  isCover: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => Offer, (offer) => offer.mediaItems, { onDelete: "CASCADE" })
  @JoinColumn({ name: "offer_id" })
  offer: Offer;
}
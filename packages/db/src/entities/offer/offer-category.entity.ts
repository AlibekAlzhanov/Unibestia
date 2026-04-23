import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Offer } from "./offer.entity.js";

@Entity("offer_categories")
export class OfferCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 100 })
  name: string;

  @Column("varchar", { length: 100, unique: true })
  slug: string;

  @Column("uuid", { name: "parent_id", nullable: true })
  parentId: string | null;

  @Column("integer", { name: "sort_order", default: 0 })
  sortOrder: number;

  @Column("boolean", { name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => OfferCategory, (offerCategory) => offerCategory.children, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "parent_id" })
  parent: OfferCategory | null;

  @OneToMany(() => OfferCategory, (offerCategory) => offerCategory.parent)
  children: OfferCategory[];

  @OneToMany(() => Offer, (offer) => offer.category)
  offers: Offer[];
}

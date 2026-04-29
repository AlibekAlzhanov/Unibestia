import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Partner } from "./partner.entity.js";
import { OfferLocation } from "../offer/offer-location.entity.js";
import { Redemption } from "../redemption/redemption.entity.js";

@Index("idx_partner_locations_partner_active", ["partnerId", "isActive"])
@Entity("partner_locations")
export class PartnerLocation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "partner_id" })
  partnerId: string;

  @Column("varchar", { length: 255 })
  name: string;

  @Column("varchar", { length: 100, nullable: true })
  city: string | null;

  @Column("text")
  address: string;

  @Column("numeric", { precision: 9, scale: 6, nullable: true })
  latitude: string | null;

  @Column("numeric", { precision: 9, scale: 6, nullable: true })
  longitude: string | null;

  @Column("boolean", { name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => Partner, (partner) => partner.locations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "partner_id" })
  partner: Partner;

  @OneToMany(() => OfferLocation, (offerLocation) => offerLocation.location)
  offerLocations: OfferLocation[];

  @OneToMany(() => Redemption, (redemption) => redemption.location)
  redemptions: Redemption[];
}
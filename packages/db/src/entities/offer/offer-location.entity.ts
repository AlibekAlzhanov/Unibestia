import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique,
} from "typeorm";
import { Offer } from "./offer.entity.js";
import { PartnerLocation } from "../partner/partner-location.entity.js";

@Entity("offer_locations")
@Unique("uq_offer_locations_offer_id_location_id", ["offerId", "locationId"])
export class OfferLocation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "offer_id" })
  offerId: string;

  @Column("uuid", { name: "location_id" })
  locationId: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => Offer, (offer) => offer.offerLocations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "offer_id" })
  offer: Offer;

  @ManyToOne(() => PartnerLocation, (location) => location.offerLocations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "location_id" })
  location: PartnerLocation;
}

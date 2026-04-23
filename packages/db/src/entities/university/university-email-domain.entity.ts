import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { University } from "./university.entity.js";

@Entity("university_email_domains")
@Unique("uq_university_email_domains_university_id_domain", ["universityId", "domain"])
export class UniversityEmailDomain {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "university_id" })
  universityId: string;

  @ManyToOne(() => University, (university) => university.emailDomains, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "university_id" })
  university: University;

  @Column("varchar", { length: 120 })
  domain: string;

  @Column("boolean", { name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}

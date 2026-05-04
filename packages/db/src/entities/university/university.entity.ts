import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { UniversityEmailDomain } from "./university-email-domain.entity.js";
import { StudentProfile } from "../student/student-profile.entity.js";

export enum UniversityStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

@Entity("universities")
export class University {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 255 })
  name: string;

  @Column("varchar", { name: "short_name", length: 100, nullable: true })
  shortName: string | null;

  @Column("text", { name: "official_name_ru", nullable: true })
  officialNameRu: string | null;

  @Column("text", { name: "official_name_kz", nullable: true })
  officialNameKz: string | null;

  @Column("text", { name: "official_name_en", nullable: true })
  officialNameEn: string | null;

  @Column("text", {
    name: "document_keywords",
    array: true,
    nullable: true,
  })
  documentKeywords: string[] | null;

  @Column("varchar", { length: 100, nullable: true })
  city: string | null;

  @Column("varchar", { length: 100, default: "Kazakhstan" })
  country: string;

  @Column({
    type: "enum",
    enum: UniversityStatus,
    default: UniversityStatus.ACTIVE,
  })
  status: UniversityStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @OneToMany(
    () => UniversityEmailDomain,
    (universityEmailDomain) => universityEmailDomain.university
  )
  emailDomains: UniversityEmailDomain[];

  @OneToMany(() => StudentProfile, (studentProfile) => studentProfile.university)
  studentProfiles: StudentProfile[];
}

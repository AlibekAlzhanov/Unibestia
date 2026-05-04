import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Unique,
} from "typeorm";
import { StudentProfile } from "../student/student-profile.entity.js";

export enum EducationDegree {
  BACHELOR = "bachelor",
  MASTER = "master",
  PHD = "phd",
  OTHER = "other",
}

@Entity("education_program_groups")
@Unique("uq_education_program_groups_code_degree", ["code", "degree"])
@Index("idx_education_program_groups_code", ["code"])
export class EducationProgramGroup {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 20 })
  code: string;

  @Column("varchar", { name: "name_ru", length: 255 })
  nameRu: string;

  @Column("varchar", { name: "name_kz", length: 255 })
  nameKz: string;

  @Column("varchar", { name: "name_en", length: 255, nullable: true })
  nameEn: string | null;

  @Column({
    type: "enum",
    enum: EducationDegree,
    default: EducationDegree.BACHELOR,
  })
  degree: EducationDegree;

  @Column("boolean", { name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @OneToMany(
    () => StudentProfile,
    (studentProfile) => studentProfile.educationProgramGroup
  )
  studentProfiles: StudentProfile[];
}

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
import { University } from "../university/university.entity.js";
import { StudentProfile } from "../student/student-profile.entity.js";

export enum EducationDegree {
  BACHELOR = "bachelor",
  MASTER = "master",
  PHD = "phd",
  OTHER = "other",
}

@Entity("education_program_groups")
@Index("idx_education_program_groups_university_id", ["universityId"])
@Index("idx_education_program_groups_code", ["code"])
export class EducationProgramGroup {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "university_id" })
  universityId: string;

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

  @ManyToOne(
    () => University,
    (university) => university.educationProgramGroups,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "university_id" })
  university: University;

  @OneToMany(
    () => StudentProfile,
    (studentProfile) => studentProfile.educationProgramGroup
  )
  studentProfiles: StudentProfile[];
}

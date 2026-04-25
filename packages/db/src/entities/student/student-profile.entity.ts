import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from "typeorm";
import { User } from "../auth/user.entity.js";
import { University } from "../university/university.entity.js";
import { StudentVerification } from "./student-verification.entity.js";

export enum StudentVerificationStatus {
  UNVERIFIED = "unverified",
  PENDING_REVIEW = "pending_review",
  VERIFIED = "verified",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

@Entity("student_profiles")
@Check(`"course" IS NULL OR "course" >= 1`)
export class StudentProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_student_profiles_user_id", { unique: true })
  @Column("uuid", { name: "user_id", unique: true })
  userId: string;

  @Column("uuid", { name: "university_id", nullable: true })
  universityId: string | null;

  @Column("citext", { name: "student_email", nullable: true })
  studentEmail: string | null;

  @Column("varchar", { name: "student_card_number", length: 100, nullable: true })
  studentCardNumber: string | null;

  @Column("varchar", { name: "degree", length: 50, nullable: true })
  degree: string | null;

  @Column("varchar", { length: 150, nullable: true })
  faculty: string | null;

  @Column("varchar", { length: 150, nullable: true })
  specialty: string | null;

  @Column("smallint", { nullable: true })
  course: number | null;

  @Column("date", { name: "admission_date", nullable: true })
  admissionDate: string | null;

  @Column("varchar", { name: "group_name", length: 50, nullable: true })
  groupName: string | null;

  @Index("idx_student_profiles_verification_status")
  @Column({
    name: "verification_status",
    type: "enum",
    enum: StudentVerificationStatus,
    default: StudentVerificationStatus.UNVERIFIED,
  })
  verificationStatus: StudentVerificationStatus;

  @Column("timestamptz", { name: "verified_at", nullable: true })
  verifiedAt: Date | null;

  @Column("timestamptz", { name: "verification_expires_at", nullable: true })
  verificationExpiresAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.studentProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => University, (university) => university.studentProfiles, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "university_id" })
  university: University | null;

  @OneToMany(() => StudentVerification, (studentVerification) => studentVerification.studentProfile)
  verifications: StudentVerification[];
}

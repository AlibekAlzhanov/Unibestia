import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../auth/user.entity.js";
import { StudentProfile } from "./student-profile.entity.js";

export enum StudentVerificationMethod {
  EDU_EMAIL = "edu_email",
  DOCUMENT_PDF = "document_pdf",
  MANUAL_REVIEW = "manual_review",
}

export enum StudentVerificationRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

@Index("idx_student_verifications_status_created", ["status", "createdAt"])
@Entity("student_verifications")
export class StudentVerification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_student_verifications_user_id")
  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("uuid", { name: "student_profile_id" })
  studentProfileId: string;

  @Column({
    type: "enum",
    enum: StudentVerificationMethod,
  })
  method: StudentVerificationMethod;

  @Index("idx_student_verifications_status")
  @Column({
    type: "enum",
    enum: StudentVerificationRequestStatus,
    default: StudentVerificationRequestStatus.PENDING,
  })
  status: StudentVerificationRequestStatus;

  @Column("citext", { name: "submitted_email", nullable: true })
  submittedEmail: string | null;

  @Column("text", { name: "document_url", nullable: true })
  documentUrl: string | null;

  @Column("varchar", { name: "document_type", length: 50, nullable: true })
  documentType: string | null;

  @Column("text", { name: "review_comment", nullable: true })
  reviewComment: string | null;

  @Column("uuid", { name: "reviewed_by_user_id", nullable: true })
  reviewedByUserId: string | null;

  @Column("timestamptz", { name: "reviewed_at", nullable: true })
  reviewedAt: Date | null;

  @Column("timestamptz", { name: "expires_at", nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.studentVerifications, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(
    () => StudentProfile,
    (studentProfile) => studentProfile.verifications,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "student_profile_id" })
  studentProfile: StudentProfile;

  @ManyToOne(() => User, (user) => user.reviewedStudentVerifications, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "reviewed_by_user_id" })
  reviewedBy: User | null;
}
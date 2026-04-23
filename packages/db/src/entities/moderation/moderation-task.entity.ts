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

export enum ModerationEntityType {
  STUDENT_VERIFICATION = "student_verification",
  PARTNER = "partner",
  OFFER = "offer",
  REVIEW = "review",
}

export enum ModerationTaskStatus {
  PENDING = "pending",
  IN_REVIEW = "in_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export enum ModerationDecision {
  APPROVE = "approve",
  REJECT = "reject",
  CANCEL = "cancel",
}

@Entity("moderation_tasks")
export class ModerationTask {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_moderation_tasks_entity_type_entity_id")
  @Column({
    name: "entity_type",
    type: "enum",
    enum: ModerationEntityType,
  })
  entityType: ModerationEntityType;

  @Index("idx_moderation_tasks_entity_id")
  @Column("uuid", { name: "entity_id" })
  entityId: string;

  @Index("idx_moderation_tasks_status")
  @Column({
    type: "enum",
    enum: ModerationTaskStatus,
    default: ModerationTaskStatus.PENDING,
  })
  status: ModerationTaskStatus;

  @Column("uuid", { name: "assigned_admin_id", nullable: true })
  assignedAdminId: string | null;

  @Column({
    type: "enum",
    enum: ModerationDecision,
    nullable: true,
  })
  decision: ModerationDecision | null;

  @Column("text", { name: "decision_comment", nullable: true })
  decisionComment: string | null;

  @Column("uuid", { name: "resolved_by_user_id", nullable: true })
  resolvedByUserId: string | null;

  @Column("timestamptz", { name: "resolved_at", nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.assignedModerationTasks, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "assigned_admin_id" })
  assignedAdminUser: User | null;

  @ManyToOne(() => User, (user) => user.resolvedModerationTasks, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "resolved_by_user_id" })
  resolvedByUser: User | null;
}

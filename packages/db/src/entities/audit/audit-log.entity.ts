import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../auth/user.entity.js";
import { Partner } from "../partner/partner.entity.js";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_audit_logs_actor_user_id")
  @Column("uuid", { name: "actor_user_id", nullable: true })
  actorUserId: string | null;

  @Column("varchar", { name: "actor_role", length: 50, nullable: true })
  actorRole: string | null;

  @Column("varchar", { length: 100 })
  action: string;

  @Index("idx_audit_logs_entity_type_entity_id")
  @Column("varchar", { name: "entity_type", length: 50 })
  entityType: string;

  @Index("idx_audit_logs_entity_id")
  @Column("uuid", { name: "entity_id", nullable: true })
  entityId: string | null;

  @Column("uuid", { name: "partner_id", nullable: true })
  partnerId: string | null;

  @Column("jsonb", { nullable: true })
  metadata: Record<string, unknown> | null;

  @Column("inet", { name: "ip_address", nullable: true })
  ipAddress: string | null;

  @Column("text", { name: "user_agent", nullable: true })
  userAgent: string | null;

  @Index("idx_audit_logs_created_at")
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.auditLogs, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "actor_user_id" })
  actorUser: User | null;

  @ManyToOne(() => Partner, (partner) => partner.auditLogs, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "partner_id" })
  partner: Partner | null;
}

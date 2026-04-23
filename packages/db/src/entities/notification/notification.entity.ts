import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../auth/user.entity.js";

export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
}

export enum NotificationType {
  VERIFICATION_STATUS = "verification_status",
  OFFER_APPROVED = "offer_approved",
  OFFER_REJECTED = "offer_rejected",
  BONUS_EARNED = "bonus_earned",
  REFERRAL_REWARD = "referral_reward",
  SYSTEM = "system",
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column({
    type: "enum",
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: "enum",
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column("varchar", { length: 255 })
  title: string;

  @Column("text")
  body: string;

  @Column("boolean", { name: "is_read", default: false })
  isRead: boolean;

  @Column("varchar", { name: "related_entity_type", length: 50, nullable: true })
  relatedEntityType: string | null;

  @Column("uuid", { name: "related_entity_id", nullable: true })
  relatedEntityId: string | null;

  @Column("timestamptz", { name: "sent_at", nullable: true })
  sentAt: Date | null;

  @Column("timestamptz", { name: "read_at", nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}

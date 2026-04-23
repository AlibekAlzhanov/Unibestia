import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { User } from "./user.entity.js";
import { Role } from "./role.entity.js";

@Entity("user_roles")
@Unique("uq_user_roles_user_id_role_id", ["userId", "roleId"])
export class UserRole {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_user_roles_user_id")
  @Column("uuid", { name: "user_id" })
  userId: string;

  @Index("idx_user_roles_role_id")
  @Column("uuid", { name: "role_id" })
  roleId: string;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role: Role;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}

import { UserStatus } from "@repo/db";

export interface UserWithRoles {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  roles: string[];
}

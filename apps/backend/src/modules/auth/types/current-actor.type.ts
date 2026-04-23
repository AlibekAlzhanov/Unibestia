import { UserStatus } from "@repo/db";

export interface CurrentActor {
  isAuthenticated: boolean;
  userId: string;
  clerkUserId: string;
  email: string;
  displayName: string | null;
  status: UserStatus;
  roles: string[];
}

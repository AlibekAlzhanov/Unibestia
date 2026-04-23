import { UserStatus } from "@repo/db";

export interface UpdateUserStatusDto {
  status: UserStatus;
}

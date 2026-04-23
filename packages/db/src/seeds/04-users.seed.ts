import type { DataSource } from "typeorm";
import { User, UserRole, Role, UserStatus } from "../entities/index.js";
import { upsertByWhere, logSeedStep } from "./utils.js";

interface SeedUser {
  email: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  status: UserStatus;
  roles: string[];
}

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const userRoleRepo = dataSource.getRepository(UserRole);

  const users: SeedUser[] = [
    {
      email: "admin@unibestie.local",
      clerkUserId: "seed_admin_001",
      firstName: "System",
      lastName: "Admin",
      displayName: "UniBestie Admin",
      status: UserStatus.ACTIVE,
      roles: ["admin"],
    },
    {
      email: "owner@coffeelab.local",
      clerkUserId: "seed_partner_owner_001",
      firstName: "Dana",
      lastName: "Akhmetova",
      displayName: "Coffee Lab Owner",
      status: UserStatus.ACTIVE,
      roles: ["partner_owner"],
    },
    {
      email: "cashier@coffeelab.local",
      clerkUserId: "seed_partner_staff_001",
      firstName: "Arman",
      lastName: "Sarsenov",
      displayName: "Coffee Lab Cashier",
      status: UserStatus.ACTIVE,
      roles: ["partner_staff"],
    },
    {
      email: "alibek@student.satbayev.local",
      clerkUserId: "seed_student_001",
      firstName: "Alibek",
      lastName: "User",
      displayName: "Alibek",
      status: UserStatus.ACTIVE,
      roles: ["student"],
    },
    {
      email: "madina@student.kaznu.local",
      clerkUserId: "seed_student_002",
      firstName: "Madina",
      lastName: "User",
      displayName: "Madina",
      status: UserStatus.ACTIVE,
      roles: ["student"],
    },
  ];

  for (const userData of users) {
    const user = await upsertByWhere(userRepo, { email: userData.email }, {
      clerkUserId: userData.clerkUserId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      displayName: userData.displayName,
      status: userData.status,
    });

    for (const roleCode of userData.roles) {
      const role = await roleRepo.findOne({ where: { code: roleCode } });

      if (!role) {
        throw new Error(`Role not found: ${roleCode}`);
      }

      await upsertByWhere(userRoleRepo, { userId: user.id, roleId: role.id }, {
        userId: user.id,
        roleId: role.id,
      } as Partial<UserRole>);
    }
  }

  await logSeedStep(dataSource, "Users and user_roles seeded");
}

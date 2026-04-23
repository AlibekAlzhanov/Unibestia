import type { DataSource } from "typeorm";
import { Role } from "../entities/index.js";
import { upsertByWhere, logSeedStep } from "./utils.js";

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepo = dataSource.getRepository(Role);

  const roles = [
    {
      code: "student",
      name: "Student",
      description: "Студент платформы UniBestie",
    },
    {
      code: "partner_owner",
      name: "Partner Owner",
      description: "Владелец партнёрского кабинета",
    },
    {
      code: "partner_manager",
      name: "Partner Manager",
      description: "Менеджер партнёра",
    },
    {
      code: "partner_staff",
      name: "Partner Staff",
      description: "Сотрудник предприятия/кассир",
    },
    {
      code: "admin",
      name: "Admin",
      description: "Администратор системы",
    },
  ];

  for (const role of roles) {
    await upsertByWhere(roleRepo, { code: role.code }, role);
  }

  await logSeedStep(dataSource, "Roles seeded");
}

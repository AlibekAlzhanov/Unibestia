import type { DataSource } from "typeorm";
import { University, UniversityEmailDomain, UniversityStatus } from "../entities/index.js";
import { upsertByWhere, logSeedStep } from "./utils.js";

export async function seedUniversities(dataSource: DataSource): Promise<void> {
  const universityRepo = dataSource.getRepository(University);
  const domainRepo = dataSource.getRepository(UniversityEmailDomain);

  const universities = [
    {
      key: "satbayev",
      name: "Satbayev University",
      shortName: "Satbayev",
      city: "Almaty",
      country: "Kazakhstan",
      status: UniversityStatus.ACTIVE,
      domains: ["stud.satbayev.university"],
    },
  ];

  for (const item of universities) {
    const university = await upsertByWhere(universityRepo, { name: item.name }, {
      name: item.name,
      shortName: item.shortName,
      city: item.city,
      country: item.country,
      status: item.status,
    });

    for (const domain of item.domains) {
      await upsertByWhere(domainRepo, { universityId: university.id, domain }, {
        universityId: university.id,
        domain,
        isActive: true,
      });
    }
  }

  await logSeedStep(dataSource, "Universities and domains seeded");
}

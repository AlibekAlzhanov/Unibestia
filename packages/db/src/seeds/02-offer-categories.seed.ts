import type { DataSource } from "typeorm";
import { OfferCategory } from "../entities/index.js";
import { upsertByWhere, logSeedStep } from "./utils.js";

export async function seedOfferCategories(dataSource: DataSource): Promise<void> {
  const categoryRepo = dataSource.getRepository(OfferCategory);

  const categories = [
    { slug: "food", name: "Еда", sortOrder: 1 },
    { slug: "services", name: "Услуги", sortOrder: 2 },
    { slug: "entertainment", name: "Развлечения", sortOrder: 3 },
    { slug: "education", name: "Образование", sortOrder: 4 },
  ];

  for (const category of categories) {
    await upsertByWhere(categoryRepo, { slug: category.slug }, category);
  }

  await logSeedStep(dataSource, "Offer categories seeded");
}

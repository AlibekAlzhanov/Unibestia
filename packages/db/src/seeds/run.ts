import dataSource from "../data-source.js";
import { seedRoles } from "./01-roles.seed.js";
import { seedOfferCategories } from "./02-offer-categories.seed.js";
import { seedUniversities } from "./03-universities.seed.js";
import { seedUsers } from "./04-users.seed.js";
import { seedStudents } from "./05-student.seed.js";
import { seedPartners } from "./06-partner.seed.js";
import { seedOffers } from "./07-offers.seed.js";
import { seedWalletsAndReferrals } from "./08-wallet-referral.seed.js";
import { seedRedemptionsAndReviews } from "./09-redemptions-reviews.seed.js";
import { seedSystemTables } from "./10-system.seed.js";

async function run(): Promise<void> {
  await dataSource.initialize();

  try {
    await seedRoles(dataSource);
    await seedOfferCategories(dataSource);
    await seedUniversities(dataSource);
    await seedUsers(dataSource);
    await seedStudents(dataSource);
    await seedPartners(dataSource);
    await seedOffers(dataSource);
    await seedWalletsAndReferrals(dataSource);
    await seedRedemptionsAndReviews(dataSource);
    await seedSystemTables(dataSource);

    console.log("✅ UniBestie seed completed successfully");
  } catch (error) {
    console.error("❌ UniBestie seed failed:", error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

void run();

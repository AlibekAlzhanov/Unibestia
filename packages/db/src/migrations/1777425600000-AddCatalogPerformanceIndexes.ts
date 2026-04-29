import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogPerformanceIndexes1777425600000
  implements MigrationInterface
{
  name = "AddCatalogPerformanceIndexes1777425600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_offer_media_offer_id"
      ON "offer_media" ("offer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_offer_media_offer_cover_sort"
      ON "offer_media" ("offer_id", "is_cover", "sort_order", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_reviews_offer_status_created"
      ON "reviews" ("offer_id", "status", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_offer_status_created"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_offer_media_offer_cover_sort"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_offer_media_offer_id"
    `);
  }
}
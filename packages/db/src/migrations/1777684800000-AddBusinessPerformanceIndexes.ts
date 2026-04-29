import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessPerformanceIndexes1777684800000
  implements MigrationInterface
{
  name = "AddBusinessPerformanceIndexes1777684800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_redemptions_partner_status"
      ON "redemptions" ("partner_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_redemptions_partner_created"
      ON "redemptions" ("partner_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_offers_partner_status"
      ON "offers" ("partner_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_partner_locations_partner_active"
      ON "partner_locations" ("partner_id", "is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_student_verifications_status_created"
      ON "student_verifications" ("status", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_student_verifications_status_created"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_partner_locations_partner_active"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_offers_partner_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_redemptions_partner_created"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_redemptions_partner_status"
    `);
  }
}
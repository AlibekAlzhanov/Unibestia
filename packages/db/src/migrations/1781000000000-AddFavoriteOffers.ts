import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFavoriteOffers1781000000000 implements MigrationInterface {
  name = "AddFavoriteOffers1781000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "favorite_offers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "offer_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_favorite_offers_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_favorite_offers_user_id_offer_id" UNIQUE ("user_id", "offer_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_favorite_offers_user_id"
      ON "favorite_offers" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_favorite_offers_offer_id"
      ON "favorite_offers" ("offer_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "favorite_offers"
      ADD CONSTRAINT "FK_favorite_offers_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "favorite_offers"
      ADD CONSTRAINT "FK_favorite_offers_offer_id"
      FOREIGN KEY ("offer_id") REFERENCES "offers"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "favorite_offers"
      DROP CONSTRAINT IF EXISTS "FK_favorite_offers_offer_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "favorite_offers"
      DROP CONSTRAINT IF EXISTS "FK_favorite_offers_user_id"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_favorite_offers_offer_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_favorite_offers_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "favorite_offers"`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRedemptionAndReview1710000000007 implements MigrationInterface {
  name = "CreateRedemptionAndReview1710000000007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."redemptions_status_enum" AS ENUM(
        'created',
        'confirmed',
        'used',
        'expired',
        'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."reviews_status_enum" AS ENUM(
        'visible',
        'hidden',
        'pending_moderation',
        'rejected'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "redemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "offer_id" uuid NOT NULL,
        "partner_id" uuid NOT NULL,
        "location_id" uuid,
        "status" "public"."redemptions_status_enum" NOT NULL DEFAULT 'created',
        "qr_token" character varying(255) NOT NULL,
        "qr_expires_at" TIMESTAMPTZ,
        "order_amount" numeric(12,2),
        "discount_amount" numeric(12,2),
        "bonus_earned" integer NOT NULL DEFAULT 0,
        "bonus_spent" integer NOT NULL DEFAULT 0,
        "used_at" TIMESTAMPTZ,
        "cancelled_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_redemptions_order_amount" CHECK ("order_amount" IS NULL OR "order_amount" >= 0),
        CONSTRAINT "CHK_redemptions_discount_amount" CHECK ("discount_amount" IS NULL OR "discount_amount" >= 0),
        CONSTRAINT "CHK_redemptions_bonus_earned" CHECK ("bonus_earned" >= 0),
        CONSTRAINT "CHK_redemptions_bonus_spent" CHECK ("bonus_spent" >= 0),
        CONSTRAINT "UQ_redemptions_qr_token" UNIQUE ("qr_token"),
        CONSTRAINT "PK_redemptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_redemptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_redemptions_offer_id" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_redemptions_partner_id" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_redemptions_location_id" FOREIGN KEY ("location_id") REFERENCES "partner_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_redemptions_user_id" ON "redemptions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_redemptions_offer_id" ON "redemptions" ("offer_id")`);
    await queryRunner.query(`CREATE INDEX "idx_redemptions_partner_id" ON "redemptions" ("partner_id")`);
    await queryRunner.query(`CREATE INDEX "idx_redemptions_status" ON "redemptions" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_redemptions_created_at" ON "redemptions" ("created_at")`);

    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "offer_id" uuid NOT NULL,
        "redemption_id" uuid NOT NULL,
        "rating" smallint NOT NULL,
        "text" text,
        "status" "public"."reviews_status_enum" NOT NULL DEFAULT 'visible',
        "moderated_by_user_id" uuid,
        "moderated_at" TIMESTAMPTZ,
        "moderation_comment" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_reviews_rating" CHECK ("rating" >= 1 AND "rating" <= 5),
        CONSTRAINT "UQ_reviews_redemption_id" UNIQUE ("redemption_id"),
        CONSTRAINT "PK_reviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_reviews_offer_id" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_reviews_redemption_id" FOREIGN KEY ("redemption_id") REFERENCES "redemptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_reviews_moderated_by_user_id" FOREIGN KEY ("moderated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_reviews_offer_id" ON "reviews" ("offer_id")`);
    await queryRunner.query(`CREATE INDEX "idx_reviews_status" ON "reviews" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_reviews_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_reviews_offer_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_redemptions_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_redemptions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_redemptions_partner_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_redemptions_offer_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_redemptions_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "redemptions"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."reviews_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."redemptions_status_enum"`);
  }
}

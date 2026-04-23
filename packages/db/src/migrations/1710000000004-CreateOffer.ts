import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOffer1710000000004 implements MigrationInterface {
  name = "CreateOffer1710000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."offers_benefit_type_enum" AS ENUM(
        'discount',
        'bonus',
        'cashback',
        'mixed'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."offers_discount_type_enum" AS ENUM(
        'percent',
        'fixed_amount'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."offers_status_enum" AS ENUM(
        'draft',
        'pending_review',
        'approved',
        'published',
        'rejected',
        'archived'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."offer_media_media_type_enum" AS ENUM(
        'image',
        'banner'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "offer_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "parent_id" uuid,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_offer_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_offer_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_offer_categories_parent_id" FOREIGN KEY ("parent_id") REFERENCES "offer_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "offers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "partner_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "short_description" character varying(500),
        "description" text NOT NULL,
        "benefit_type" "public"."offers_benefit_type_enum" NOT NULL,
        "discount_type" "public"."offers_discount_type_enum",
        "discount_value" numeric(12,2),
        "cashback_percent" numeric(5,2),
        "bonus_reward_points" integer,
        "min_purchase_amount" numeric(12,2),
        "terms" text,
        "usage_limit_per_user" integer,
        "total_usage_limit" integer,
        "start_at" TIMESTAMPTZ NOT NULL,
        "end_at" TIMESTAMPTZ,
        "status" "public"."offers_status_enum" NOT NULL DEFAULT 'draft',
        "is_featured" boolean NOT NULL DEFAULT false,
        "published_at" TIMESTAMPTZ,
        "created_by_user_id" uuid NOT NULL,
        "updated_by_user_id" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "CHK_offers_discount_value" CHECK ("discount_value" IS NULL OR "discount_value" >= 0),
        CONSTRAINT "CHK_offers_cashback_percent" CHECK ("cashback_percent" IS NULL OR ("cashback_percent" >= 0 AND "cashback_percent" <= 100)),
        CONSTRAINT "CHK_offers_bonus_reward_points" CHECK ("bonus_reward_points" IS NULL OR "bonus_reward_points" >= 0),
        CONSTRAINT "CHK_offers_min_purchase_amount" CHECK ("min_purchase_amount" IS NULL OR "min_purchase_amount" >= 0),
        CONSTRAINT "UQ_offers_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_offers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_offers_partner_id" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_offers_category_id" FOREIGN KEY ("category_id") REFERENCES "offer_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_offers_created_by_user_id" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_offers_updated_by_user_id" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_offers_partner_id" ON "offers" ("partner_id")`);
    await queryRunner.query(`CREATE INDEX "idx_offers_category_id" ON "offers" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "idx_offers_status" ON "offers" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_offers_start_at" ON "offers" ("start_at")`);
    await queryRunner.query(`CREATE INDEX "idx_offers_end_at" ON "offers" ("end_at")`);
    await queryRunner.query(`CREATE INDEX "idx_offers_published_at" ON "offers" ("published_at")`);

    await queryRunner.query(`
      CREATE TABLE "offer_media" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "offer_id" uuid NOT NULL,
        "media_type" "public"."offer_media_media_type_enum" NOT NULL,
        "file_url" text NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_cover" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_offer_media_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_offer_media_offer_id" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "offer_locations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "offer_id" uuid NOT NULL,
        "location_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_offer_locations_offer_id_location_id" UNIQUE ("offer_id", "location_id"),
        CONSTRAINT "PK_offer_locations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_offer_locations_offer_id" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_offer_locations_location_id" FOREIGN KEY ("location_id") REFERENCES "partner_locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "offer_locations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "offer_media"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_offers_published_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_offers_end_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_offers_start_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_offers_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_offers_category_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_offers_partner_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "offers"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "offer_categories"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."offer_media_media_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."offers_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."offers_discount_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."offers_benefit_type_enum"`);
  }
}

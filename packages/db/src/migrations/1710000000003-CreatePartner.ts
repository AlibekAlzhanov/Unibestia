import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePartner1710000000003 implements MigrationInterface {
  name = "CreatePartner1710000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."partners_status_enum" AS ENUM(
        'pending',
        'approved',
        'rejected',
        'suspended',
        'archived'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."partner_members_member_role_enum" AS ENUM(
        'owner',
        'manager',
        'staff',
        'analyst'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "partners" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "legal_name" character varying(255) NOT NULL,
        "brand_name" character varying(255) NOT NULL,
        "description" text,
        "contact_email" citext NOT NULL,
        "contact_phone" character varying(30),
        "website_url" text,
        "instagram_url" text,
        "logo_url" text,
        "status" "public"."partners_status_enum" NOT NULL DEFAULT 'pending',
        "created_by_user_id" uuid NOT NULL,
        "approved_by_user_id" uuid,
        "approved_at" TIMESTAMPTZ,
        "rejection_reason" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_partners_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_partners_created_by_user_id" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_partners_approved_by_user_id" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_partners_status" ON "partners" ("status")
    `);

    await queryRunner.query(`
      CREATE TABLE "partner_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "partner_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "member_role" "public"."partner_members_member_role_enum" NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_partner_members_partner_id_user_id" UNIQUE ("partner_id", "user_id"),
        CONSTRAINT "PK_partner_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_partner_members_partner_id" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_partner_members_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_partner_members_partner_id" ON "partner_members" ("partner_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_partner_members_user_id" ON "partner_members" ("user_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "partner_locations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "partner_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "city" character varying(100),
        "address" text NOT NULL,
        "latitude" numeric(9,6),
        "longitude" numeric(9,6),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_partner_locations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_partner_locations_partner_id" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_locations"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_partner_members_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_partner_members_partner_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_members"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_partners_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partners"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."partner_members_member_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."partners_status_enum"`);
  }
}

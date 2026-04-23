import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableCitextAndCreateAuth1710000000001 implements MigrationInterface {
  name = "EnableCitextAndCreateAuth1710000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS citext;`);

    await queryRunner.query(`
      CREATE TYPE "public"."users_status_enum" AS ENUM(
        'active',
        'blocked',
        'pending',
        'disabled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_code" UNIQUE ("code"),
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clerk_user_id" character varying(255) NOT NULL,
        "email" citext NOT NULL,
        "first_name" character varying(100),
        "last_name" character varying(100),
        "display_name" character varying(150),
        "phone" character varying(30),
        "avatar_url" text,
        "status" "public"."users_status_enum" NOT NULL DEFAULT 'active',
        "last_login_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "UQ_users_clerk_user_id" UNIQUE ("clerk_user_id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_clerk_user_id" ON "users" ("clerk_user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_user_roles_user_id_role_id" UNIQUE ("user_id", "role_id"),
        CONSTRAINT "PK_user_roles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_roles_user_id" ON "user_roles" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_roles_role_id" ON "user_roles" ("role_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_user_roles_role_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_user_roles_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_clerk_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_status_enum"`);
  }
}

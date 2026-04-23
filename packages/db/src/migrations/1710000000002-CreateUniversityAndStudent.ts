import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUniversityAndStudent1710000000002 implements MigrationInterface {
  name = "CreateUniversityAndStudent1710000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."universities_status_enum" AS ENUM(
        'active',
        'inactive'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."student_profiles_verification_status_enum" AS ENUM(
        'unverified',
        'pending_review',
        'verified',
        'rejected',
        'expired'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."student_verifications_method_enum" AS ENUM(
        'edu_email',
        'document_pdf',
        'manual_review'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."student_verifications_status_enum" AS ENUM(
        'pending',
        'approved',
        'rejected',
        'expired'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "universities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "short_name" character varying(100),
        "city" character varying(100),
        "country" character varying(100) NOT NULL DEFAULT 'Kazakhstan',
        "status" "public"."universities_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_universities_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "university_email_domains" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "university_id" uuid NOT NULL,
        "domain" character varying(120) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_university_email_domains_university_id_domain" UNIQUE ("university_id", "domain"),
        CONSTRAINT "PK_university_email_domains_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_university_email_domains_university_id" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "student_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "university_id" uuid,
        "student_email" citext,
        "student_card_number" character varying(100),
        "faculty" character varying(150),
        "specialty" character varying(150),
        "course" smallint,
        "group_name" character varying(50),
        "verification_status" "public"."student_profiles_verification_status_enum" NOT NULL DEFAULT 'unverified',
        "verified_at" TIMESTAMPTZ,
        "verification_expires_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_student_profiles_course" CHECK ("course" IS NULL OR "course" >= 1),
        CONSTRAINT "UQ_student_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_student_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_student_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_student_profiles_university_id" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_student_profiles_user_id" ON "student_profiles" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_student_profiles_verification_status" ON "student_profiles" ("verification_status")
    `);

    await queryRunner.query(`
      CREATE TABLE "student_verifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "student_profile_id" uuid NOT NULL,
        "method" "public"."student_verifications_method_enum" NOT NULL,
        "status" "public"."student_verifications_status_enum" NOT NULL DEFAULT 'pending',
        "submitted_email" citext,
        "document_url" text,
        "document_type" character varying(50),
        "review_comment" text,
        "reviewed_by_user_id" uuid,
        "reviewed_at" TIMESTAMPTZ,
        "expires_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_verifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_student_verifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_student_verifications_student_profile_id" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_student_verifications_reviewed_by_user_id" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_student_verifications_user_id" ON "student_verifications" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_student_verifications_status" ON "student_verifications" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_student_verifications_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_student_verifications_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_verifications"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_student_profiles_verification_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_student_profiles_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_profiles"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "university_email_domains"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "universities"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."student_verifications_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."student_verifications_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."student_profiles_verification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."universities_status_enum"`);
  }
}

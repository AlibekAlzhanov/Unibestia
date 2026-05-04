import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEducationProgramGroupsForStudentVerification1777900000000
  implements MigrationInterface
{
  name = "AddEducationProgramGroupsForStudentVerification1777900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "public"."education_program_groups_degree_enum" AS ENUM(
          'bachelor',
          'master',
          'phd',
          'other'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "universities"
        ADD COLUMN IF NOT EXISTS "official_name_ru" text
    `);

    await queryRunner.query(`
      ALTER TABLE "universities"
        ADD COLUMN IF NOT EXISTS "official_name_kz" text
    `);

    await queryRunner.query(`
      ALTER TABLE "universities"
        ADD COLUMN IF NOT EXISTS "official_name_en" text
    `);

    await queryRunner.query(`
      ALTER TABLE "universities"
        ADD COLUMN IF NOT EXISTS "document_keywords" text[]
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "education_program_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "university_id" uuid NOT NULL,
        "code" character varying(20) NOT NULL,
        "name_ru" character varying(255) NOT NULL,
        "name_kz" character varying(255) NOT NULL,
        "name_en" character varying(255),
        "degree" "public"."education_program_groups_degree_enum" NOT NULL DEFAULT 'bachelor',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_education_program_groups_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_education_program_groups_university_id"
      ON "education_program_groups" ("university_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_education_program_groups_code"
      ON "education_program_groups" ("code")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        ALTER TABLE "education_program_groups"
          ADD CONSTRAINT "FK_education_program_groups_university_id"
          FOREIGN KEY ("university_id")
          REFERENCES "universities"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        ADD COLUMN IF NOT EXISTS "education_program_group_id" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_student_profiles_education_program_group_id"
      ON "student_profiles" ("education_program_group_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        ALTER TABLE "student_profiles"
          ADD CONSTRAINT "FK_student_profiles_education_program_group_id"
          FOREIGN KEY ("education_program_group_id")
          REFERENCES "education_program_groups"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        DROP CONSTRAINT IF EXISTS "FK_student_profiles_education_program_group_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_student_profiles_education_program_group_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        DROP COLUMN IF EXISTS "education_program_group_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "education_program_groups"
        DROP CONSTRAINT IF EXISTS "FK_education_program_groups_university_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_education_program_groups_code"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_education_program_groups_university_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "education_program_groups"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."education_program_groups_degree_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "universities"
        DROP COLUMN IF EXISTS "document_keywords"
    `);

    await queryRunner.query(`
      ALTER TABLE "universities"
        DROP COLUMN IF EXISTS "official_name_en"
    `);

    await queryRunner.query(`
      ALTER TABLE "universities"
        DROP COLUMN IF EXISTS "official_name_kz"
    `);

    await queryRunner.query(`
      ALTER TABLE "universities"
        DROP COLUMN IF EXISTS "official_name_ru"
    `);
  }
}

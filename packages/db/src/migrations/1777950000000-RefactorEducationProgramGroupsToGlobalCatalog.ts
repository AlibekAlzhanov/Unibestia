import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorEducationProgramGroupsToGlobalCatalog1777950000000
  implements MigrationInterface
{
  name = "RefactorEducationProgramGroupsToGlobalCatalog1777950000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        fk_name text;
      BEGIN
        SELECT tc.constraint_name
        INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = 'education_program_groups'
          AND kcu.column_name = 'university_id'
        LIMIT 1;

        IF fk_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "education_program_groups" DROP CONSTRAINT %I', fk_name);
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_education_program_groups_university_id"`
    );

    await queryRunner.query(
      `ALTER TABLE "education_program_groups" DROP COLUMN IF EXISTS "university_id"`
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_education_program_groups_code_degree" ON "education_program_groups" ("code", "degree")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_education_program_groups_code_degree"`
    );

    await queryRunner.query(
      `ALTER TABLE "education_program_groups" ADD COLUMN IF NOT EXISTS "university_id" uuid`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_education_program_groups_university_id" ON "education_program_groups" ("university_id")`
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_schema = 'public'
            AND table_name = 'education_program_groups'
            AND constraint_name = 'fk_education_program_groups_university_id'
        ) THEN
          ALTER TABLE "education_program_groups"
          ADD CONSTRAINT "fk_education_program_groups_university_id"
          FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }
}

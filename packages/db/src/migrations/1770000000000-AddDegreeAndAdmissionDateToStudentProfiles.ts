import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDegreeAndAdmissionDateToStudentProfiles1770000000000
  implements MigrationInterface
{
  name = "AddDegreeAndAdmissionDateToStudentProfiles1770000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      ADD COLUMN IF NOT EXISTS "degree" varchar(50)
    `);

    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      ADD COLUMN IF NOT EXISTS "admission_date" date
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      DROP COLUMN IF EXISTS "admission_date"
    `);

    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      DROP COLUMN IF EXISTS "degree"
    `);
  }
}

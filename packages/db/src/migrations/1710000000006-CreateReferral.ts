import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReferral1710000000006 implements MigrationInterface {
  name = "CreateReferral1710000000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."referral_rewards_status_enum" AS ENUM(
        'registered',
        'verified',
        'rewarded',
        'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "referral_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "code" character varying(50) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_referral_codes_user_id" UNIQUE ("user_id"),
        CONSTRAINT "UQ_referral_codes_code" UNIQUE ("code"),
        CONSTRAINT "PK_referral_codes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_referral_codes_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "referral_rewards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "referrer_user_id" uuid NOT NULL,
        "referred_user_id" uuid NOT NULL,
        "referral_code_id" uuid NOT NULL,
        "status" "public"."referral_rewards_status_enum" NOT NULL DEFAULT 'registered',
        "referrer_reward_points" integer NOT NULL DEFAULT 0,
        "referred_reward_points" integer NOT NULL DEFAULT 0,
        "rewarded_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_referral_rewards_referred_user_id" UNIQUE ("referred_user_id"),
        CONSTRAINT "PK_referral_rewards_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_referral_rewards_referrer_user_id" FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_referral_rewards_referred_user_id" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_referral_rewards_referral_code_id" FOREIGN KEY ("referral_code_id") REFERENCES "referral_codes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "referral_rewards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referral_codes"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."referral_rewards_status_enum"`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWallet1710000000005 implements MigrationInterface {
  name = "CreateWallet1710000000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."wallet_transactions_type_enum" AS ENUM(
        'earn',
        'spend',
        'expire',
        'adjustment',
        'refund'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."wallet_transactions_source_type_enum" AS ENUM(
        'redemption',
        'referral',
        'admin',
        'promotion',
        'manual'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "available_balance" integer NOT NULL DEFAULT 0,
        "lifetime_earned" integer NOT NULL DEFAULT 0,
        "lifetime_spent" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_wallets_available_balance" CHECK ("available_balance" >= 0),
        CONSTRAINT "CHK_wallets_lifetime_earned" CHECK ("lifetime_earned" >= 0),
        CONSTRAINT "CHK_wallets_lifetime_spent" CHECK ("lifetime_spent" >= 0),
        CONSTRAINT "UQ_wallets_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_wallets_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wallets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wallet_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "wallet_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "type" "public"."wallet_transactions_type_enum" NOT NULL,
        "source_type" "public"."wallet_transactions_source_type_enum" NOT NULL,
        "source_id" uuid,
        "points_delta" integer NOT NULL,
        "balance_after" integer NOT NULL,
        "expires_at" TIMESTAMPTZ,
        "comment" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallet_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wallet_transactions_wallet_id" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_wallet_transactions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_wallet_transactions_wallet_id" ON "wallet_transactions" ("wallet_id")`);
    await queryRunner.query(`CREATE INDEX "idx_wallet_transactions_user_id" ON "wallet_transactions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_wallet_transactions_source_type_source_id" ON "wallet_transactions" ("source_type")`);
    await queryRunner.query(`CREATE INDEX "idx_wallet_transactions_source_id" ON "wallet_transactions" ("source_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_wallet_transactions_source_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_wallet_transactions_source_type_source_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_wallet_transactions_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_wallet_transactions_wallet_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallet_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallets"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wallet_transactions_source_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wallet_transactions_type_enum"`);
  }
}

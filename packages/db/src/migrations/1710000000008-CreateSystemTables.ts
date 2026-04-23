import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSystemTables1710000000008 implements MigrationInterface {
  name = "CreateSystemTables1710000000008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."notifications_type_enum" AS ENUM(
        'verification_status',
        'offer_approved',
        'offer_rejected',
        'bonus_earned',
        'referral_reward',
        'system'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."notifications_channel_enum" AS ENUM(
        'in_app',
        'email'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."moderation_tasks_entity_type_enum" AS ENUM(
        'student_verification',
        'partner',
        'offer',
        'review'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."moderation_tasks_status_enum" AS ENUM(
        'pending',
        'in_review',
        'approved',
        'rejected',
        'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."moderation_tasks_decision_enum" AS ENUM(
        'approve',
        'reject',
        'cancel'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" "public"."notifications_type_enum" NOT NULL,
        "channel" "public"."notifications_channel_enum" NOT NULL,
        "title" character varying(255) NOT NULL,
        "body" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "related_entity_type" character varying(50),
        "related_entity_id" uuid,
        "sent_at" TIMESTAMPTZ,
        "read_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "moderation_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entity_type" "public"."moderation_tasks_entity_type_enum" NOT NULL,
        "entity_id" uuid NOT NULL,
        "status" "public"."moderation_tasks_status_enum" NOT NULL DEFAULT 'pending',
        "assigned_admin_id" uuid,
        "decision" "public"."moderation_tasks_decision_enum",
        "decision_comment" text,
        "resolved_by_user_id" uuid,
        "resolved_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_moderation_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_moderation_tasks_assigned_admin_id" FOREIGN KEY ("assigned_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_moderation_tasks_resolved_by_user_id" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_moderation_tasks_entity_type_entity_id" ON "moderation_tasks" ("entity_type")`);
    await queryRunner.query(`CREATE INDEX "idx_moderation_tasks_entity_id" ON "moderation_tasks" ("entity_id")`);
    await queryRunner.query(`CREATE INDEX "idx_moderation_tasks_status" ON "moderation_tasks" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_user_id" uuid,
        "actor_role" character varying(50),
        "action" character varying(100) NOT NULL,
        "entity_type" character varying(50) NOT NULL,
        "entity_id" uuid,
        "partner_id" uuid,
        "metadata" jsonb,
        "ip_address" inet,
        "user_agent" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_actor_user_id" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_audit_logs_partner_id" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_audit_logs_actor_user_id" ON "audit_logs" ("actor_user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_entity_type_entity_id" ON "audit_logs" ("entity_type")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_entity_id" ON "audit_logs" ("entity_id")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_audit_logs_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_audit_logs_entity_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_audit_logs_entity_type_entity_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_audit_logs_actor_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_moderation_tasks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_moderation_tasks_entity_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_moderation_tasks_entity_type_entity_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "moderation_tasks"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."moderation_tasks_decision_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."moderation_tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."moderation_tasks_entity_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notifications_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notifications_type_enum"`);
  }
}

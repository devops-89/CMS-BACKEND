import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774946867033 implements MigrationInterface {
    name = 'Migration1774946867033'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // ✅ Ensure UUID extension exists
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`
            CREATE TABLE "judge_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "expertise" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "totalEvaluations" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "REL_efba74fc9fb6a2cbd6d71ab2db" UNIQUE ("userId"),
                CONSTRAINT "PK_fa2402e977e3803d435786dbaab" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."contest_judges_status_enum" AS ENUM('active', 'inactive')
        `);

        await queryRunner.query(`
            CREATE TABLE "contest_judges" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "contest_id" uuid NOT NULL,
                "judge_profile_id" uuid NOT NULL,
                "status" "public"."contest_judges_status_enum" NOT NULL DEFAULT 'active',
                "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_38ea6ab5ad91c8866ef22eec8b7" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_23957b88beed90d50a628b00ec" 
            ON "contest_judges" ("contest_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_bbac398c3b649d4d3d6264c85a" 
            ON "contest_judges" ("judge_profile_id")
        `);

        await queryRunner.query(`
            ALTER TABLE "contests" 
            ADD CONSTRAINT "UQ_3c2c6333d5ce62a729ac66e7ef9" UNIQUE ("name")
        `);

        // ✅ Enum migration (SAFE)
        await queryRunner.query(`
            ALTER TYPE "public"."contests_status_enum" RENAME TO "contests_status_enum_old"
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."contests_status_enum" 
            AS ENUM('Draft', 'Published', 'Offline')
        `);

        await queryRunner.query(`
            ALTER TABLE "contests" ALTER COLUMN "status" DROP DEFAULT
        `);

        // ✅ FIXED: safe mapping
        await queryRunner.query(`
            ALTER TABLE "contests" 
            ALTER COLUMN "status" 
            TYPE "public"."contests_status_enum"
            USING 
            CASE 
                WHEN status = 'draft' THEN 'Draft'
                WHEN status = 'published' THEN 'Published'
                WHEN status = 'offline' THEN 'Offline'
                ELSE 'Draft'
            END::"public"."contests_status_enum"
        `);

        await queryRunner.query(`
            ALTER TABLE "contests" ALTER COLUMN "status" SET DEFAULT 'Draft'
        `);

        await queryRunner.query(`
            DROP TYPE "public"."contests_status_enum_old"
        `);

        await queryRunner.query(`
            ALTER TABLE "judge_profiles"
            ADD CONSTRAINT "FK_efba74fc9fb6a2cbd6d71ab2db4"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "contest_judges"
            ADD CONSTRAINT "FK_23957b88beed90d50a628b00ec9"
            FOREIGN KEY ("contest_id") REFERENCES "contests"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "contest_judges"
            ADD CONSTRAINT "FK_bbac398c3b649d4d3d6264c85a0"
            FOREIGN KEY ("judge_profile_id") REFERENCES "judge_profiles"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
            ALTER TABLE "contest_judges" DROP CONSTRAINT "FK_bbac398c3b649d4d3d6264c85a0"
        `);

        await queryRunner.query(`
            ALTER TABLE "contest_judges" DROP CONSTRAINT "FK_23957b88beed90d50a628b00ec9"
        `);

        await queryRunner.query(`
            ALTER TABLE "judge_profiles" DROP CONSTRAINT "FK_efba74fc9fb6a2cbd6d71ab2db4"
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."contests_status_enum_old" 
            AS ENUM('draft', 'published', 'offline')
        `);

        await queryRunner.query(`
            ALTER TABLE "contests" ALTER COLUMN "status" DROP DEFAULT
        `);

        // ✅ Safe reverse mapping
        await queryRunner.query(`
            ALTER TABLE "contests" 
            ALTER COLUMN "status" 
            TYPE "public"."contests_status_enum_old"
            USING 
            CASE 
                WHEN status = 'Draft' THEN 'draft'
                WHEN status = 'Published' THEN 'published'
                WHEN status = 'Offline' THEN 'offline'
                ELSE 'draft'
            END::"public"."contests_status_enum_old"
        `);

        await queryRunner.query(`
            ALTER TABLE "contests" ALTER COLUMN "status" SET DEFAULT 'draft'
        `);

        await queryRunner.query(`
            DROP TYPE "public"."contests_status_enum"
        `);

        await queryRunner.query(`
            ALTER TYPE "public"."contests_status_enum_old" 
            RENAME TO "contests_status_enum"
        `);

        await queryRunner.query(`
            ALTER TABLE "contests" DROP CONSTRAINT "UQ_3c2c6333d5ce62a729ac66e7ef9"
        `);

        await queryRunner.query(`
            DROP INDEX "public"."IDX_bbac398c3b649d4d3d6264c85a"
        `);

        await queryRunner.query(`
            DROP INDEX "public"."IDX_23957b88beed90d50a628b00ec"
        `);

        await queryRunner.query(`
            DROP TABLE "contest_judges"
        `);

        await queryRunner.query(`
            DROP TYPE "public"."contest_judges_status_enum"
        `);

        await queryRunner.query(`
            DROP TABLE "judge_profiles"
        `);
    }
}
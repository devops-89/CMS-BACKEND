import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774807836737 implements MigrationInterface {
    name = 'Migration1774807836737'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."entries_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contest_id" uuid NOT NULL, "participant_id" uuid NOT NULL, "title" character varying NOT NULL, "thumbnail_url" character varying, "score" double precision NOT NULL DEFAULT '0', "status" "public"."entries_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_23d4e7e9b58d9939f113832915b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2c3b9b089406d894e073244793" ON "entries" ("contest_id") `);
        await queryRunner.query(`CREATE TYPE "public"."contests_status_enum" AS ENUM('draft', 'published', 'offline')`);
        await queryRunner.query(`CREATE TABLE "contests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "status" "public"."contests_status_enum" NOT NULL DEFAULT 'draft', "available_regions" text, "form_template_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b8012f5cf6f444a52179e1227a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."participants_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contest_id" uuid NOT NULL, "submission_id" uuid NOT NULL, "status" "public"."participants_status_enum" NOT NULL DEFAULT 'pending', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_149dacdec927238c1fcdcd7774" UNIQUE ("submission_id"), CONSTRAINT "PK_1cda06c31eec1c95b3365a0283f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f38f57a9cf594c87c96494b2d6" ON "participants" ("contest_id") `);
        await queryRunner.query(`CREATE TYPE "public"."votes_payment_status_enum" AS ENUM('paid', 'unpaid')`);
        await queryRunner.query(`CREATE TABLE "votes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entry_id" uuid NOT NULL, "vote_email" character varying NOT NULL, "user_email" character varying, "schedule_name" character varying, "vote_count" integer NOT NULL DEFAULT '1', "payment_status" "public"."votes_payment_status_enum" NOT NULL DEFAULT 'unpaid', "judge_score" double precision, "ip_address" character varying, "session_id" character varying, "fingerprint" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f3d9fd4a0af865152c3f59db8ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4693eabce5c8fcb72a0dfc768c" ON "votes" ("entry_id") `);
        await queryRunner.query(`ALTER TABLE "entries" ADD CONSTRAINT "FK_2c3b9b089406d894e073244793d" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entries" ADD CONSTRAINT "FK_2aa0e317b9afbdfcf19467caffc" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_59955557863dd9c78ebfe0d4ad8" FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "participants" ADD CONSTRAINT "FK_f38f57a9cf594c87c96494b2d64" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "participants" ADD CONSTRAINT "FK_149dacdec927238c1fcdcd77744" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "votes" ADD CONSTRAINT "FK_4693eabce5c8fcb72a0dfc768c2" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "votes" DROP CONSTRAINT "FK_4693eabce5c8fcb72a0dfc768c2"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP CONSTRAINT "FK_149dacdec927238c1fcdcd77744"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP CONSTRAINT "FK_f38f57a9cf594c87c96494b2d64"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_59955557863dd9c78ebfe0d4ad8"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_2aa0e317b9afbdfcf19467caffc"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_2c3b9b089406d894e073244793d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4693eabce5c8fcb72a0dfc768c"`);
        await queryRunner.query(`DROP TABLE "votes"`);
        await queryRunner.query(`DROP TYPE "public"."votes_payment_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f38f57a9cf594c87c96494b2d6"`);
        await queryRunner.query(`DROP TABLE "participants"`);
        await queryRunner.query(`DROP TYPE "public"."participants_status_enum"`);
        await queryRunner.query(`DROP TABLE "contests"`);
        await queryRunner.query(`DROP TYPE "public"."contests_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2c3b9b089406d894e073244793"`);
        await queryRunner.query(`DROP TABLE "entries"`);
        await queryRunner.query(`DROP TYPE "public"."entries_status_enum"`);
    }

}

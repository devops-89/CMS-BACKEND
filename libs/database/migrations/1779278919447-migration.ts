import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779278919447 implements MigrationInterface {
    name = 'Migration1779278919447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "admin_profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "adminCode" character varying, "isActive" boolean NOT NULL DEFAULT true, "department" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "REL_1a272d44c2214c1e8b22a886d6" UNIQUE ("userId"), CONSTRAINT "PK_bc784ca31eb1821ba53980ca23d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "judge_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expertise" text, "isActive" boolean NOT NULL DEFAULT true, "totalEvaluations" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "REL_efba74fc9fb6a2cbd6d71ab2db" UNIQUE ("userId"), CONSTRAINT "PK_fa2402e977e3803d435786dbaab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "form_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "schema" jsonb NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "version" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dda93f70be71cb4a2e496b5ae49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "form_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "data" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "template_id" uuid, CONSTRAINT "PK_fb6e1e9f26cda31c358a8a1530e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_508fb421afa2c6eca3f07a112d" ON "form_submissions" ("template_id") `);
        await queryRunner.query(`CREATE TABLE "participant_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dateOfBirth" TIMESTAMP NOT NULL, "country" character varying NOT NULL, "schoolName" character varying NOT NULL, "grade" character varying NOT NULL, "submission_id" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "REL_79bcfabab73c6fbb4a11f69296" UNIQUE ("userId"), CONSTRAINT "REL_3405810878e8e8e628871132b3" UNIQUE ("submission_id"), CONSTRAINT "PK_578bbbf4d571f7b614aeb78dde1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."participants_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contest_id" uuid NOT NULL, "submission_id" uuid NOT NULL, "user_id" uuid, "status" "public"."participants_status_enum" NOT NULL DEFAULT 'pending', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_149dacdec927238c1fcdcd7774" UNIQUE ("submission_id"), CONSTRAINT "PK_1cda06c31eec1c95b3365a0283f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f38f57a9cf594c87c96494b2d6" ON "participants" ("contest_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1427a77e06023c250ed3794a1b" ON "participants" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'judge', 'participant', 'moderator')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('Active', 'Inactive', 'Suspended', 'Pending', 'Banned', 'Rejected', 'Upcoming', 'Completed', 'Offline', 'Published', 'Draft')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "avatarUrl" character varying, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, "status" "public"."users_status_enum" NOT NULL DEFAULT 'Active', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."otps_type_enum" AS ENUM('PASSWORD_RESET')`);
        await queryRunner.query(`CREATE TABLE "otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "otp" text NOT NULL, "type" "public"."otps_type_enum" NOT NULL DEFAULT 'PASSWORD_RESET', "expires_at" TIMESTAMP NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "token" text NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."entries_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contest_id" uuid NOT NULL, "participant_id" uuid NOT NULL, "submission_id" uuid NOT NULL, "score" double precision NOT NULL DEFAULT '0', "status" "public"."entries_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_c9d26736a67025bb0ab93199ca" UNIQUE ("submission_id"), CONSTRAINT "PK_23d4e7e9b58d9939f113832915b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2c3b9b089406d894e073244793" ON "entries" ("contest_id") `);
        await queryRunner.query(`CREATE TYPE "public"."contest_judges_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "contest_judges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contest_id" uuid NOT NULL, "judge_profile_id" uuid NOT NULL, "status" "public"."contest_judges_status_enum" NOT NULL DEFAULT 'active', "assigned_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_38ea6ab5ad91c8866ef22eec8b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_23957b88beed90d50a628b00ec" ON "contest_judges" ("contest_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bbac398c3b649d4d3d6264c85a" ON "contest_judges" ("judge_profile_id") `);
        await queryRunner.query(`CREATE TYPE "public"."voting_periods_voting_type_enum" AS ENUM('PUBLIC', 'JUDGE', 'PAID')`);
        await queryRunner.query(`CREATE TABLE "voting_periods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contest_id" uuid NOT NULL, "voting_type" "public"."voting_periods_voting_type_enum" NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0acaef400554525c3398707e5a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6e8da03ed248fba6d8d34a1c45" ON "voting_periods" ("contest_id") `);
        await queryRunner.query(`CREATE TYPE "public"."contests_status_enum" AS ENUM('Draft', 'Published', 'Offline')`);
        await queryRunner.query(`CREATE TABLE "contests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "status" "public"."contests_status_enum" NOT NULL DEFAULT 'Draft', "available_regions" text, "form_template_id" uuid, "entry_level_template_id" uuid, "user_level_template_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3c2c6333d5ce62a729ac66e7ef9" UNIQUE ("name"), CONSTRAINT "PK_0b8012f5cf6f444a52179e1227a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."votes_payment_status_enum" AS ENUM('paid', 'unpaid')`);
        await queryRunner.query(`CREATE TABLE "votes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entry_id" uuid NOT NULL, "vote_email" character varying NOT NULL, "user_email" character varying, "schedule_name" character varying, "vote_count" integer NOT NULL DEFAULT '1', "payment_status" "public"."votes_payment_status_enum" NOT NULL DEFAULT 'unpaid', "judge_score" double precision, "ip_address" character varying, "session_id" character varying, "fingerprint" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f3d9fd4a0af865152c3f59db8ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4693eabce5c8fcb72a0dfc768c" ON "votes" ("entry_id") `);
        await queryRunner.query(`ALTER TABLE "admin_profile" ADD CONSTRAINT "FK_1a272d44c2214c1e8b22a886d61" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "judge_profiles" ADD CONSTRAINT "FK_efba74fc9fb6a2cbd6d71ab2db4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "form_submissions" ADD CONSTRAINT "FK_508fb421afa2c6eca3f07a112dc" FOREIGN KEY ("template_id") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ADD CONSTRAINT "FK_79bcfabab73c6fbb4a11f692964" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ADD CONSTRAINT "FK_3405810878e8e8e628871132b3c" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "participants" ADD CONSTRAINT "FK_f38f57a9cf594c87c96494b2d64" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "participants" ADD CONSTRAINT "FK_149dacdec927238c1fcdcd77744" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "participants" ADD CONSTRAINT "FK_1427a77e06023c250ed3794a1ba" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entries" ADD CONSTRAINT "FK_2c3b9b089406d894e073244793d" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entries" ADD CONSTRAINT "FK_2aa0e317b9afbdfcf19467caffc" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entries" ADD CONSTRAINT "FK_c9d26736a67025bb0ab93199ca4" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contest_judges" ADD CONSTRAINT "FK_23957b88beed90d50a628b00ec9" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contest_judges" ADD CONSTRAINT "FK_bbac398c3b649d4d3d6264c85a0" FOREIGN KEY ("judge_profile_id") REFERENCES "judge_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "voting_periods" ADD CONSTRAINT "FK_6e8da03ed248fba6d8d34a1c454" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_59955557863dd9c78ebfe0d4ad8" FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_f0e1021f6ed3cbf12e8d368bcb0" FOREIGN KEY ("entry_level_template_id") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_6f7219e74572c1b14b826003946" FOREIGN KEY ("user_level_template_id") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "votes" ADD CONSTRAINT "FK_4693eabce5c8fcb72a0dfc768c2" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "votes" DROP CONSTRAINT "FK_4693eabce5c8fcb72a0dfc768c2"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_6f7219e74572c1b14b826003946"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_f0e1021f6ed3cbf12e8d368bcb0"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_59955557863dd9c78ebfe0d4ad8"`);
        await queryRunner.query(`ALTER TABLE "voting_periods" DROP CONSTRAINT "FK_6e8da03ed248fba6d8d34a1c454"`);
        await queryRunner.query(`ALTER TABLE "contest_judges" DROP CONSTRAINT "FK_bbac398c3b649d4d3d6264c85a0"`);
        await queryRunner.query(`ALTER TABLE "contest_judges" DROP CONSTRAINT "FK_23957b88beed90d50a628b00ec9"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_c9d26736a67025bb0ab93199ca4"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_2aa0e317b9afbdfcf19467caffc"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_2c3b9b089406d894e073244793d"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP CONSTRAINT "FK_1427a77e06023c250ed3794a1ba"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP CONSTRAINT "FK_149dacdec927238c1fcdcd77744"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP CONSTRAINT "FK_f38f57a9cf594c87c96494b2d64"`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" DROP CONSTRAINT "FK_3405810878e8e8e628871132b3c"`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" DROP CONSTRAINT "FK_79bcfabab73c6fbb4a11f692964"`);
        await queryRunner.query(`ALTER TABLE "form_submissions" DROP CONSTRAINT "FK_508fb421afa2c6eca3f07a112dc"`);
        await queryRunner.query(`ALTER TABLE "judge_profiles" DROP CONSTRAINT "FK_efba74fc9fb6a2cbd6d71ab2db4"`);
        await queryRunner.query(`ALTER TABLE "admin_profile" DROP CONSTRAINT "FK_1a272d44c2214c1e8b22a886d61"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4693eabce5c8fcb72a0dfc768c"`);
        await queryRunner.query(`DROP TABLE "votes"`);
        await queryRunner.query(`DROP TYPE "public"."votes_payment_status_enum"`);
        await queryRunner.query(`DROP TABLE "contests"`);
        await queryRunner.query(`DROP TYPE "public"."contests_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6e8da03ed248fba6d8d34a1c45"`);
        await queryRunner.query(`DROP TABLE "voting_periods"`);
        await queryRunner.query(`DROP TYPE "public"."voting_periods_voting_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbac398c3b649d4d3d6264c85a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_23957b88beed90d50a628b00ec"`);
        await queryRunner.query(`DROP TABLE "contest_judges"`);
        await queryRunner.query(`DROP TYPE "public"."contest_judges_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2c3b9b089406d894e073244793"`);
        await queryRunner.query(`DROP TABLE "entries"`);
        await queryRunner.query(`DROP TYPE "public"."entries_status_enum"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "otps"`);
        await queryRunner.query(`DROP TYPE "public"."otps_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1427a77e06023c250ed3794a1b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f38f57a9cf594c87c96494b2d6"`);
        await queryRunner.query(`DROP TABLE "participants"`);
        await queryRunner.query(`DROP TYPE "public"."participants_status_enum"`);
        await queryRunner.query(`DROP TABLE "participant_profiles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_508fb421afa2c6eca3f07a112d"`);
        await queryRunner.query(`DROP TABLE "form_submissions"`);
        await queryRunner.query(`DROP TABLE "form_templates"`);
        await queryRunner.query(`DROP TABLE "judge_profiles"`);
        await queryRunner.query(`DROP TABLE "admin_profile"`);
    }

}

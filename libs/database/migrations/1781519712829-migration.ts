import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781519712829 implements MigrationInterface {
    name = 'Migration1781519712829'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "countries" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(10) NOT NULL, "phoneCode" character varying(10), "currencyCode" character varying(10), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fa1376321185575cf2226b1491" ON "countries" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b47cbb5311bad9c9ae17b8c1ed" ON "countries" ("code") `);
        await queryRunner.query(`CREATE TABLE "judge_assigned_voting_periods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "voting_period_id" uuid NOT NULL, "judge_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b81a8076805bf82c187371d1e48" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4f2677499a5d9a4a137dbaacf9" ON "judge_assigned_voting_periods" ("voting_period_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ed5557c29fbba9573b946bf336" ON "judge_assigned_voting_periods" ("judge_id") `);
        await queryRunner.query(`CREATE TABLE "judge_evaluations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entry_id" uuid NOT NULL, "judge_id" uuid NOT NULL, "contest_id" uuid NOT NULL, "voting_period_id" uuid NOT NULL, "scores" jsonb NOT NULL DEFAULT '[]', "total_score" double precision NOT NULL, "max_score" integer, "feedback" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2227b01d68597ef94e5ee6efebe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_336e9fb53453e8369e96eae79a" ON "judge_evaluations" ("entry_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f0fcb7e3bfc42e46a350551b5f" ON "judge_evaluations" ("judge_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_15d4af233da270f31c6ea1a3a3" ON "judge_evaluations" ("contest_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_14af6c3040c4af8b348864d3d1" ON "judge_evaluations" ("voting_period_id") `);
        await queryRunner.query(`CREATE TABLE "judge_evaluation_histories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evaluation_id" uuid NOT NULL, "scores" jsonb NOT NULL DEFAULT '[]', "total_score" double precision NOT NULL, "max_score" integer, "feedback" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_581b4f5fa8a18c5aa0c24dafafa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ff1593a56a5930f2ab786e0644" ON "judge_evaluation_histories" ("evaluation_id") `);
        await queryRunner.query(`ALTER TABLE "contest_judges" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "voting_periods" ADD "max_score" integer`);
        await queryRunner.query(`ALTER TABLE "voting_periods" ADD "criteria" jsonb`);
        await queryRunner.query(`ALTER TABLE "contests" ADD "created_by" uuid`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "countryId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD "participant_profile_data" jsonb DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "form_template_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "dateOfBirth" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "country" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "schoolName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "grade" DROP NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."entry_assignments_status_enum" RENAME TO "entry_assignments_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."entry_assignments_status_enum" AS ENUM('pending', 'in_review', 'reviewed', 'rejected', 'evaluated')`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" TYPE "public"."entry_assignments_status_enum" USING "status"::"text"::"public"."entry_assignments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."entry_assignments_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "firstName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "lastName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_9a102ffa211c38589ad61786ca7" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_cc0dc7234854a65964f1a268275" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_94c93fd5df3860a5ce85bd016d2" FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "judge_assigned_voting_periods" ADD CONSTRAINT "FK_4f2677499a5d9a4a137dbaacf9c" FOREIGN KEY ("voting_period_id") REFERENCES "voting_periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "judge_assigned_voting_periods" ADD CONSTRAINT "FK_ed5557c29fbba9573b946bf3367" FOREIGN KEY ("judge_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "judge_evaluations" ADD CONSTRAINT "FK_336e9fb53453e8369e96eae79ab" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "judge_evaluations" ADD CONSTRAINT "FK_f0fcb7e3bfc42e46a350551b5ff" FOREIGN KEY ("judge_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "judge_evaluations" ADD CONSTRAINT "FK_15d4af233da270f31c6ea1a3a35" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "judge_evaluations" ADD CONSTRAINT "FK_14af6c3040c4af8b348864d3d17" FOREIGN KEY ("voting_period_id") REFERENCES "voting_periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "judge_evaluation_histories" ADD CONSTRAINT "FK_ff1593a56a5930f2ab786e0644f" FOREIGN KEY ("evaluation_id") REFERENCES "judge_evaluations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judge_evaluation_histories" DROP CONSTRAINT "FK_ff1593a56a5930f2ab786e0644f"`);
        await queryRunner.query(`ALTER TABLE "judge_evaluations" DROP CONSTRAINT "FK_14af6c3040c4af8b348864d3d17"`);
        await queryRunner.query(`ALTER TABLE "judge_evaluations" DROP CONSTRAINT "FK_15d4af233da270f31c6ea1a3a35"`);
        await queryRunner.query(`ALTER TABLE "judge_evaluations" DROP CONSTRAINT "FK_f0fcb7e3bfc42e46a350551b5ff"`);
        await queryRunner.query(`ALTER TABLE "judge_evaluations" DROP CONSTRAINT "FK_336e9fb53453e8369e96eae79ab"`);
        await queryRunner.query(`ALTER TABLE "judge_assigned_voting_periods" DROP CONSTRAINT "FK_ed5557c29fbba9573b946bf3367"`);
        await queryRunner.query(`ALTER TABLE "judge_assigned_voting_periods" DROP CONSTRAINT "FK_4f2677499a5d9a4a137dbaacf9c"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_94c93fd5df3860a5ce85bd016d2"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_cc0dc7234854a65964f1a268275"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_9a102ffa211c38589ad61786ca7"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."entry_assignments_status_enum_old" AS ENUM('pending', 'in_review', 'reviewed', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" TYPE "public"."entry_assignments_status_enum_old" USING "status"::"text"::"public"."entry_assignments_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."entry_assignments_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."entry_assignments_status_enum_old" RENAME TO "entry_assignments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "grade" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "schoolName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "country" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "dateOfBirth" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "form_template_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "participant_profile_data"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "countryId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "voting_periods" DROP COLUMN "criteria"`);
        await queryRunner.query(`ALTER TABLE "voting_periods" DROP COLUMN "max_score"`);
        await queryRunner.query(`ALTER TABLE "contest_judges" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff1593a56a5930f2ab786e0644"`);
        await queryRunner.query(`DROP TABLE "judge_evaluation_histories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_14af6c3040c4af8b348864d3d1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_15d4af233da270f31c6ea1a3a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0fcb7e3bfc42e46a350551b5f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_336e9fb53453e8369e96eae79a"`);
        await queryRunner.query(`DROP TABLE "judge_evaluations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed5557c29fbba9573b946bf336"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f2677499a5d9a4a137dbaacf9"`);
        await queryRunner.query(`DROP TABLE "judge_assigned_voting_periods"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b47cbb5311bad9c9ae17b8c1ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fa1376321185575cf2226b1491"`);
        await queryRunner.query(`DROP TABLE "countries"`);
    }

}

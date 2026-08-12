import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781171752051 implements MigrationInterface {
    name = 'Migration1781171752051'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "judge_evaluations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entry_id" uuid NOT NULL, "judge_id" uuid NOT NULL, "contest_id" uuid NOT NULL, "voting_period_id" uuid NOT NULL, "scores" jsonb NOT NULL DEFAULT '[]', "total_score" double precision NOT NULL, "max_score" integer, "feedback" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2227b01d68597ef94e5ee6efebe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_336e9fb53453e8369e96eae79a" ON "judge_evaluations" ("entry_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f0fcb7e3bfc42e46a350551b5f" ON "judge_evaluations" ("judge_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_15d4af233da270f31c6ea1a3a3" ON "judge_evaluations" ("contest_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_14af6c3040c4af8b348864d3d1" ON "judge_evaluations" ("voting_period_id") `);
        await queryRunner.query(`CREATE TABLE "judge_evaluation_histories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "evaluation_id" uuid NOT NULL, "scores" jsonb NOT NULL DEFAULT '[]', "total_score" double precision NOT NULL, "max_score" integer, "feedback" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_581b4f5fa8a18c5aa0c24dafafa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ff1593a56a5930f2ab786e0644" ON "judge_evaluation_histories" ("evaluation_id") `);
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
        await queryRunner.query(`DROP INDEX "public"."IDX_ff1593a56a5930f2ab786e0644"`);
        await queryRunner.query(`DROP TABLE "judge_evaluation_histories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_14af6c3040c4af8b348864d3d1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_15d4af233da270f31c6ea1a3a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0fcb7e3bfc42e46a350551b5f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_336e9fb53453e8369e96eae79a"`);
        await queryRunner.query(`DROP TABLE "judge_evaluations"`);
    }

}

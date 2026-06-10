import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781095705128 implements MigrationInterface {
    name = 'Migration1781095705128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "judge_assigned_voting_periods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "voting_period_id" uuid NOT NULL, "judge_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b81a8076805bf82c187371d1e48" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4f2677499a5d9a4a137dbaacf9" ON "judge_assigned_voting_periods" ("voting_period_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ed5557c29fbba9573b946bf336" ON "judge_assigned_voting_periods" ("judge_id") `);
        await queryRunner.query(`ALTER TABLE "judge_assigned_voting_periods" ADD CONSTRAINT "FK_4f2677499a5d9a4a137dbaacf9c" FOREIGN KEY ("voting_period_id") REFERENCES "voting_periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "judge_assigned_voting_periods" ADD CONSTRAINT "FK_ed5557c29fbba9573b946bf3367" FOREIGN KEY ("judge_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judge_assigned_voting_periods" DROP CONSTRAINT "FK_ed5557c29fbba9573b946bf3367"`);
        await queryRunner.query(`ALTER TABLE "judge_assigned_voting_periods" DROP CONSTRAINT "FK_4f2677499a5d9a4a137dbaacf9c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed5557c29fbba9573b946bf336"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f2677499a5d9a4a137dbaacf9"`);
        await queryRunner.query(`DROP TABLE "judge_assigned_voting_periods"`);
    }

}

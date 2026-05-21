import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779358859572 implements MigrationInterface {
    name = 'Migration1779358859572'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."entry_assignments_status_enum" AS ENUM('pending', 'in_review', 'reviewed', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "entry_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contest_id" uuid NOT NULL, "judge_id" uuid NOT NULL, "entry_id" uuid NOT NULL, "status" "public"."entry_assignments_status_enum" NOT NULL DEFAULT 'pending', "score" double precision, "feedback" text, "reviewed_at" TIMESTAMP, "assigned_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fbc6d0c12bb850e7af57e281c8d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a728c86b1e34998c239b6e59a2" ON "entry_assignments" ("contest_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bf0807e9d8a151594b92828697" ON "entry_assignments" ("judge_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_690a64b022c8b05558c4fcf57c" ON "entry_assignments" ("entry_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b27cb16c26a8ef3d3409b9e472" ON "entry_assignments" ("contest_id", "judge_id", "entry_id") `);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ADD CONSTRAINT "FK_a728c86b1e34998c239b6e59a2a" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ADD CONSTRAINT "FK_bf0807e9d8a151594b928286978" FOREIGN KEY ("judge_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ADD CONSTRAINT "FK_690a64b022c8b05558c4fcf57c8" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entry_assignments" DROP CONSTRAINT "FK_690a64b022c8b05558c4fcf57c8"`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" DROP CONSTRAINT "FK_bf0807e9d8a151594b928286978"`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" DROP CONSTRAINT "FK_a728c86b1e34998c239b6e59a2a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b27cb16c26a8ef3d3409b9e472"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_690a64b022c8b05558c4fcf57c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf0807e9d8a151594b92828697"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a728c86b1e34998c239b6e59a2"`);
        await queryRunner.query(`DROP TABLE "entry_assignments"`);
        await queryRunner.query(`DROP TYPE "public"."entry_assignments_status_enum"`);
    }

}

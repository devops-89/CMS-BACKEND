import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779278919447 implements MigrationInterface {
    name = 'Migration1779278919447'

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
        CREATE TYPE "public"."voting_periods_voting_type_enum"
        AS ENUM('PUBLIC', 'JUDGE', 'PAID')
    `);

        await queryRunner.query(`
        CREATE TABLE "voting_periods" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "contest_id" uuid NOT NULL,
            "voting_type" "public"."voting_periods_voting_type_enum" NOT NULL,
            "start_date" TIMESTAMP NOT NULL,
            "end_date" TIMESTAMP NOT NULL,
            "is_active" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_0acaef400554525c3398707e5a6"
            PRIMARY KEY ("id")
        )
    `);

        await queryRunner.query(`
        CREATE INDEX "IDX_6e8da03ed248fba6d8d34a1c45"
        ON "voting_periods" ("contest_id")
    `);

        await queryRunner.query(`
        ALTER TABLE "voting_periods"
        ADD CONSTRAINT "FK_6e8da03ed248fba6d8d34a1c454"
        FOREIGN KEY ("contest_id")
        REFERENCES "contests"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
        ALTER TABLE "voting_periods"
        DROP CONSTRAINT "FK_6e8da03ed248fba6d8d34a1c454"
    `);

        await queryRunner.query(`
        DROP INDEX "public"."IDX_6e8da03ed248fba6d8d34a1c45"
    `);

        await queryRunner.query(`
        DROP TABLE "voting_periods"
    `);

        await queryRunner.query(`
        DROP TYPE "public"."voting_periods_voting_type_enum"
    `);
    }

}

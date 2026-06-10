import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781091300586 implements MigrationInterface {
    name = 'Migration1781091300586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "voting_periods" ADD "max_score" integer`);
        await queryRunner.query(`ALTER TABLE "voting_periods" ADD "criteria" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "voting_periods" DROP COLUMN "criteria"`);
        await queryRunner.query(`ALTER TABLE "voting_periods" DROP COLUMN "max_score"`);
    }

}

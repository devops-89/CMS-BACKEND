import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779425809471 implements MigrationInterface {
    name = 'Migration1779425809471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contest_judges" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contest_judges" DROP COLUMN "deleted_at"`);
    }

}

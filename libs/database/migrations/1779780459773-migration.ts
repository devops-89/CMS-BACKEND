import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779780459773 implements MigrationInterface {
    name = 'Migration1779780459773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
    }

}

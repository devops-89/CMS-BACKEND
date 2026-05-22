import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779369892594 implements MigrationInterface {
    name = 'Migration1779369892594'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entry_assignments" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entry_assignments" DROP COLUMN "deleted_at"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779433281193 implements MigrationInterface {
    name = 'Migration1779433281193'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "participant_profile_data" jsonb DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "participant_profile_data"`);
    }

}

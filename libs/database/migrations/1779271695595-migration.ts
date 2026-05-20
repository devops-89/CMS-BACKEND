import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779271695595 implements MigrationInterface {
    name = 'Migration1779271695595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "participant_profiles" ADD "submission_id" uuid`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ADD CONSTRAINT "UQ_3405810878e8e8e628871132b3c" UNIQUE ("submission_id")`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ADD CONSTRAINT "FK_3405810878e8e8e628871132b3c" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "participant_profiles" DROP CONSTRAINT "FK_3405810878e8e8e628871132b3c"`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" DROP CONSTRAINT "UQ_3405810878e8e8e628871132b3c"`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" DROP COLUMN "submission_id"`);
    }

}

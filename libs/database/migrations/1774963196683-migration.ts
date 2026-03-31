import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774963196683 implements MigrationInterface {
    name = 'Migration1774963196683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entries" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP COLUMN "thumbnail_url"`);
        await queryRunner.query(`ALTER TABLE "entries" ADD "submission_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "entries" ADD CONSTRAINT "UQ_c9d26736a67025bb0ab93199ca4" UNIQUE ("submission_id")`);
        await queryRunner.query(`ALTER TABLE "entries" ADD CONSTRAINT "FK_c9d26736a67025bb0ab93199ca4" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_c9d26736a67025bb0ab93199ca4"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "UQ_c9d26736a67025bb0ab93199ca4"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP COLUMN "submission_id"`);
        await queryRunner.query(`ALTER TABLE "entries" ADD "thumbnail_url" character varying`);
        await queryRunner.query(`ALTER TABLE "entries" ADD "title" character varying NOT NULL`);
    }

}

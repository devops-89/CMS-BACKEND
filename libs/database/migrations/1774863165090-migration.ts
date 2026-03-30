import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774863165090 implements MigrationInterface {
    name = 'Migration1774863165090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contests" ADD "entry_level_template_id" uuid`);
        await queryRunner.query(`ALTER TABLE "contests" ADD "user_level_template_id" uuid`);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_f0e1021f6ed3cbf12e8d368bcb0" FOREIGN KEY ("entry_level_template_id") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_6f7219e74572c1b14b826003946" FOREIGN KEY ("user_level_template_id") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_6f7219e74572c1b14b826003946"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_f0e1021f6ed3cbf12e8d368bcb0"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP COLUMN "user_level_template_id"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP COLUMN "entry_level_template_id"`);
    }

}

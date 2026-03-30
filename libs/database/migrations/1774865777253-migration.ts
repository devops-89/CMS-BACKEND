import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774865777253 implements MigrationInterface {
    name = 'Migration1774865777253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_59955557863dd9c78ebfe0d4ad8"`);
        await queryRunner.query(`ALTER TABLE "contests" ALTER COLUMN "form_template_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_59955557863dd9c78ebfe0d4ad8" FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_59955557863dd9c78ebfe0d4ad8"`);
        await queryRunner.query(`ALTER TABLE "contests" ALTER COLUMN "form_template_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_59955557863dd9c78ebfe0d4ad8" FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}

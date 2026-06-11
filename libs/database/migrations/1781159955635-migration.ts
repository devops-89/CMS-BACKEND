import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781159955635 implements MigrationInterface {
    name = 'Migration1781159955635'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contests" ADD "created_by" uuid`);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_9a102ffa211c38589ad61786ca7" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_9a102ffa211c38589ad61786ca7"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP COLUMN "created_by"`);
    }

}

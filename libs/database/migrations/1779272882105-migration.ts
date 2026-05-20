import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779272882105 implements MigrationInterface {
    name = 'Migration1779272882105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "participants" ADD "user_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_1427a77e06023c250ed3794a1b" ON "participants" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "participants" ADD CONSTRAINT "FK_1427a77e06023c250ed3794a1ba" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "participants" DROP CONSTRAINT "FK_1427a77e06023c250ed3794a1ba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1427a77e06023c250ed3794a1b"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "user_id"`);
    }

}

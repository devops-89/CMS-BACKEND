import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781507439592 implements MigrationInterface {
    name = 'Migration1781507439592'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "countries" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(10) NOT NULL, "phoneCode" character varying(10), "currencyCode" character varying(10), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fa1376321185575cf2226b1491" ON "countries" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b47cbb5311bad9c9ae17b8c1ed" ON "countries" ("code") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "countryId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_cc0dc7234854a65964f1a268275" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_cc0dc7234854a65964f1a268275"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "countryId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b47cbb5311bad9c9ae17b8c1ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fa1376321185575cf2226b1491"`);
        await queryRunner.query(`DROP TABLE "countries"`);
    }

}

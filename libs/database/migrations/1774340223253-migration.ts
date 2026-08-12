import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774340223253 implements MigrationInterface {
    name = 'Migration1774340223253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "form_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "data" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "template_id" uuid, CONSTRAINT "PK_fb6e1e9f26cda31c358a8a1530e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_508fb421afa2c6eca3f07a112d" ON "form_submissions" ("template_id") `);
        await queryRunner.query(`CREATE TABLE "form_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "schema" jsonb NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "version" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dda93f70be71cb4a2e496b5ae49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "form_submissions" ADD CONSTRAINT "FK_508fb421afa2c6eca3f07a112dc" FOREIGN KEY ("template_id") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "form_submissions" DROP CONSTRAINT "FK_508fb421afa2c6eca3f07a112dc"`);
        await queryRunner.query(`DROP TABLE "form_templates"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_508fb421afa2c6eca3f07a112d"`);
        await queryRunner.query(`DROP TABLE "form_submissions"`);
    }

}

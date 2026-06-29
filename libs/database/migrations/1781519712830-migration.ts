import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781519712830 implements MigrationInterface {
    name = 'Migration1781519712830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create roles table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
                CONSTRAINT "PK_roles" PRIMARY KEY ("id")
            )
        `);

        // 2. Insert default roles
        await queryRunner.query(`
            INSERT INTO "roles" ("name") VALUES 
            ('admin'),
            ('judge'),
            ('participant'),
            ('moderator'),
            ('public'),
            ('super_admin')
            ON CONFLICT ("name") DO NOTHING
        `);

        // 3. Add separate role_id field to users table
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role_id" uuid`);
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_role_id" 
            FOREIGN KEY ("role_id") REFERENCES "roles"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // 4. Add separate role_id field to permissions table
        await queryRunner.query(`ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "role_id" uuid`);
        await queryRunner.query(`
            ALTER TABLE "permissions" 
            ADD CONSTRAINT "FK_permissions_role_id" 
            FOREIGN KEY ("role_id") REFERENCES "roles"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT IF EXISTS "FK_permissions_role_id"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN IF EXISTS "role_id"`);

        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_role_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role_id"`);

        await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    }
}

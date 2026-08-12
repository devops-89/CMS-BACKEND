import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781248588090 implements MigrationInterface {
    name = 'Migration1781248588090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."entry_assignments_status_enum" RENAME TO "entry_assignments_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."entry_assignments_status_enum" AS ENUM('pending', 'in_review', 'reviewed', 'rejected', 'evaluated')`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" TYPE "public"."entry_assignments_status_enum" USING "status"::"text"::"public"."entry_assignments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."entry_assignments_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."entry_assignments_status_enum_old" AS ENUM('pending', 'in_review', 'reviewed', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" TYPE "public"."entry_assignments_status_enum_old" USING "status"::"text"::"public"."entry_assignments_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "entry_assignments" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."entry_assignments_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."entry_assignments_status_enum_old" RENAME TO "entry_assignments_status_enum"`);
    }

}

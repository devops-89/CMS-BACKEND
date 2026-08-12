import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779437874399 implements MigrationInterface {
    name = 'Migration1779437874399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "dateOfBirth" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "country" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "schoolName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "grade" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "grade" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "schoolName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "country" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "participant_profiles" ALTER COLUMN "dateOfBirth" SET NOT NULL`);
    }

}

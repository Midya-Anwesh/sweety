import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1794854836882 implements MigrationInterface {
    name = 'Initial1794854836882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."readings_slot_enum" AS ENUM('morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner')`);
        await queryRunner.query(`CREATE TABLE "readings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "date" date NOT NULL, "slot" "public"."readings_slot_enum" NOT NULL, "value" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_readings_user_date_slot" UNIQUE ("userId", "date", "slot"), CONSTRAINT "CHK_readings_value" CHECK ("value" BETWEEN 40 AND 600), CONSTRAINT "PK_a0f3aa79140b41884f2e53ba52a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('doctor', 'patient')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'patient', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "readings" ADD CONSTRAINT "FK_c2a7827076a2ca8393ef61a0255" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "readings" DROP CONSTRAINT "FK_c2a7827076a2ca8393ef61a0255"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "readings"`);
        await queryRunner.query(`DROP TYPE "public"."readings_slot_enum"`);
    }

}

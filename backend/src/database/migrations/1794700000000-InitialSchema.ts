import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialSchema1794700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid', default: 'gen_random_uuid()' },
        { name: 'name', type: 'varchar', length: '255' },
        { name: 'email', type: 'varchar', length: '255', isUnique: true },
        { name: 'passwordHash', type: 'varchar', length: '255' },
        { name: 'role', type: 'enum', enum: ['doctor', 'patient'], enumName: 'users_role_enum', default: "'patient'" },
        { name: 'createdAt', type: 'timestamptz', default: 'now()' },
        { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
      ],
    }));

    await queryRunner.createTable(new Table({
      name: 'readings',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid', default: 'gen_random_uuid()' },
        { name: 'userId', type: 'uuid' },
        { name: 'date', type: 'date' },
        {
          name: 'slot', type: 'enum', enumName: 'readings_slot_enum',
          enum: ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'],
        },
        { name: 'value', type: 'integer' },
        { name: 'createdAt', type: 'timestamptz', default: 'now()' },
        { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
      ],
      foreignKeys: [{
        name: 'FK_readings_user', columnNames: ['userId'],
        referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE',
      }],
      uniques: [{ name: 'UQ_readings_user_date_slot', columnNames: ['userId', 'date', 'slot'] }],
      checks: [{ name: 'CHK_readings_value', expression: '"value" BETWEEN 40 AND 600' }],
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('readings');
    await queryRunner.dropTable('users');
  }
}

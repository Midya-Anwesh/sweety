import {
  Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Reading } from '../readings/reading.entity';
import { UserRole } from './user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'users_role_enum', default: UserRole.PATIENT })
  role!: UserRole;

  @OneToMany(() => Reading, (reading) => reading.user)
  readings!: Relation<Reading[]>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

// Explicit allowlist: returning a newly saved entity would expose its hash.
export function publicUser(user: User) {
  return {
    id: user.id, name: user.name, email: user.email, role: user.role,
    createdAt: user.createdAt, updatedAt: user.updatedAt,
  };
}

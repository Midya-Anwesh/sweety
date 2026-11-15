import {
  Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, Unique, UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../users/user.entity';
import { ReadingSlot } from './reading-slot.enum';

@Entity('readings')
@Unique('UQ_readings_user_date_slot', ['userId', 'date', 'slot'])
@Check('CHK_readings_value', '"value" BETWEEN 40 AND 600')
export class Reading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.readings, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<User>;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: ReadingSlot, enumName: 'readings_slot_enum' })
  slot!: ReadingSlot;

  @Column({ type: 'int' })
  value!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

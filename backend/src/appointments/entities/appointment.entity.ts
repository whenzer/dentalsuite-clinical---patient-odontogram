import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AppointmentReminderLogEntity } from './appointment-reminder-log.entity';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ReminderType = 'email' | 'sms' | 'both';

@Entity('appointments')
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  @Column({ type: 'varchar', length: 50 })
  customerPhone: string;

  @Column({ type: 'varchar', length: 255 })
  customerEmail: string;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  date: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 10 })
  startTime: string; // HH:mm

  @Column({ type: 'int', default: 30 })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 10 })
  endTime: string; // HH:mm

  @Index()
  @Column({ type: 'varchar', length: 255 })
  doctorName: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  operatory: string;

  @Column({ type: 'varchar', length: 100 })
  procedureCategory: string;

  @Column({ type: 'varchar', length: 255 })
  procedureName: string;

  @Column({ type: 'jsonb', default: [] })
  relatedTeeth: number[];

  @Index()
  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  cancelReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  rescheduledFrom?: {
    date: string;
    startTime: string;
  };

  @Column({ type: 'varchar', length: 20, default: 'email' })
  reminderPreference: ReminderType;

  @Column({ type: 'boolean', default: true })
  automatedRemindersEnabled: boolean;

  @OneToMany(() => AppointmentReminderLogEntity, (log) => log.appointment, {
    cascade: true,
  })
  reminderLogs: AppointmentReminderLogEntity[];

  // Clinical session & photo ops integration
  @Column({ type: 'boolean', default: false })
  sessionLogged: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  treatmentLogId?: string;

  @Column({ type: 'int', default: 0 })
  sessionPhotosCount: number;

  @Column({ type: 'jsonb', default: [] })
  sessionPhotoIds: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  sessionCompletedAt?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

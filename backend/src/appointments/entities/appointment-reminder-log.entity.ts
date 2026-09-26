import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AppointmentEntity } from './appointment.entity';

@Entity('appointment_reminder_logs')
export class AppointmentReminderLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  appointmentId: string;

  @ManyToOne(() => AppointmentEntity, (appointment) => appointment.reminderLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: AppointmentEntity;

  @Column({ type: 'varchar', length: 20 })
  type: 'email' | 'sms';

  @Column({ type: 'varchar', length: 255 })
  recipient: string;

  @Column({ type: 'varchar', length: 50 })
  timestamp: string;

  @Column({ type: 'varchar', length: 50 })
  trigger:
    | 'automated_48h'
    | 'automated_24h'
    | 'automated_2h'
    | 'manual_staff'
    | 'booking_confirmation'
    | 'reschedule_notice'
    | 'cancellation_notice';

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 30, default: 'sent' })
  status: 'sent' | 'delivered';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

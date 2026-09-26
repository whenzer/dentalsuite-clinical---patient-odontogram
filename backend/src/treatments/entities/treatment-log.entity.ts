import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PatientEntity } from '../../patients/entities/patient.entity';
import { UrgencyLevel } from '../../rules/urgency-rules.service';

@Entity('treatment_logs')
export class TreatmentLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.treatmentLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  patient: PatientEntity;

  @Column({ type: 'varchar', length: 50 })
  date: string;

  @Column({ type: 'varchar', length: 255 })
  doctorName: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  procedureName: string;

  @Column({ type: 'jsonb', default: [] })
  teethInvolved: number[];

  @Column({ type: 'text' })
  clinicalNotes: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  cost: number;

  @Column({ type: 'varchar', length: 50, default: 'Completed' })
  status: 'Completed' | 'In Progress' | 'Planned';

  @Column({ type: 'uuid', nullable: true })
  snapshotId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  urgencyGroup?: UrgencyLevel;

  @Column({ type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  determinationId?: string;

  @Column({ type: 'jsonb', nullable: true })
  consumables?: any[];

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  minAmountPhp?: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  maxAmountPhp?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

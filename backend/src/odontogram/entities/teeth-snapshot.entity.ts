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
import { TeethChartState } from '../../rules/dental-rules.service';

@Entity('teeth_snapshots')
export class TeethSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.teethSnapshots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: PatientEntity;

  @Column({ type: 'varchar', length: 50 })
  date: string;

  @Column({ type: 'varchar', length: 255 })
  visitTitle: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb' })
  chart: TeethChartState;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

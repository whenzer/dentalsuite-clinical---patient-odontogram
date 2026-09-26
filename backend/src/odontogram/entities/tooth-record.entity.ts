import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { PatientEntity } from '../../patients/entities/patient.entity';
import { ToothCondition, ToothNumber, ToothSurface } from '../../rules/dental-rules.service';

@Entity('tooth_records')
@Unique(['patientId', 'toothNumber'])
export class ToothRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.teeth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: PatientEntity;

  @Column({ type: 'int' })
  toothNumber: ToothNumber; // 1 to 32

  @Column({ type: 'varchar', length: 50, default: 'healthy' })
  condition: ToothCondition;

  @Column({ type: 'jsonb', default: [] })
  surfaces: ToothSurface[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'int', default: 0 })
  mobility?: 0 | 1 | 2 | 3;

  @Column({ type: 'float', nullable: true })
  pocketDepthMm?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastTreatedDate?: string;

  @Column({ type: 'jsonb', nullable: true })
  surfaceColors?: Record<string, string>;
}

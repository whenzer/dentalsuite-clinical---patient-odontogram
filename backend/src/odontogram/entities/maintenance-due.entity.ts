import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PatientEntity } from '../../patients/entities/patient.entity';

@Entity('maintenance_dues')
export class MaintenanceDueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.cleaningDues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: PatientEntity;

  @Column({ type: 'varchar', length: 150 })
  type: string;

  @Column({ type: 'varchar', length: 50 })
  lastDoneDate: string;

  @Column({ type: 'int', default: 6 })
  intervalMonths: number;

  @Column({ type: 'varchar', length: 50 })
  nextDueDate: string;

  @Column({ type: 'varchar', length: 30, default: 'up_to_date' })
  status: 'up_to_date' | 'due_soon' | 'overdue';

  @Column({ type: 'text', nullable: true })
  notes?: string;
}

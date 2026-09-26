import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PatientEntity } from '../../patients/entities/patient.entity';
import { UrgencyLevel } from '../../rules/urgency-rules.service';

@Entity('recommended_services')
export class RecommendedServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.recommendedServices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  patient: PatientEntity;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', length: 30, default: 'routine' })
  priority: 'urgent' | 'high' | 'routine' | 'cosmetic';

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 100 })
  suggestedNextVisitTimeframe: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  estimatedFee: number;

  @Column({ type: 'jsonb', default: [] })
  relatedTeeth: number[];

  @Column({ type: 'boolean', default: false })
  preemptive: boolean;

  @Column({ type: 'boolean', default: false })
  addedToSchedule: boolean;

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
}

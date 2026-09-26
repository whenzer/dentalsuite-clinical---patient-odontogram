import { Entity, PrimaryColumn, Column } from 'typeorm';
import { UrgencyLevel } from '../../rules/urgency-rules.service';

@Entity('treatment_determinations')
export class TreatmentDeterminationEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  clinicId?: string;

  @Column({ type: 'varchar', length: 255 })
  treatmentName: string;

  @Column({ type: 'varchar', length: 50 })
  urgencyGroup: UrgencyLevel;

  @Column({ type: 'int', default: 2 })
  urgencyRank: 1 | 2 | 3;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  minAmountPhp: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  maxAmountPhp: number;

  @Column({ type: 'int', default: 30 })
  minDurationMinutes: number;

  @Column({ type: 'int', default: 60 })
  maxDurationMinutes: number;

  @Column({ type: 'jsonb', default: [] })
  commonlyUsedConsumables: any[];

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  indication?: string;
}

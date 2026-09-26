import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PatientEntity } from './patient.entity';

@Entity('before_after_pairs')
export class BeforeAfterPairEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.beforeAfterPairs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  patient: PatientEntity;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  beforePhotoId: string;

  @Column({ type: 'varchar', length: 255 })
  afterPhotoId: string;

  @Column({ type: 'varchar', length: 50 })
  dateCreated: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', default: [] })
  relatedTeeth: number[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

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

@Entity('dental_photos')
export class DentalPhotoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  patient: PatientEntity;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 255 })
  caption: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'intraoral',
  })
  category: 'intraoral' | 'extraoral' | 'xray' | 'pre_op' | 'post_op' | 'smile' | 'other';

  @Column({ type: 'varchar', length: 50 })
  takenAt: string;

  @Column({ type: 'jsonb', default: [] })
  relatedTeeth: number[];

  @Column({ type: 'varchar', length: 20, default: 'standard' })
  stage: 'before' | 'after' | 'standard';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

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

@Entity('attached_files')
export class AttachedFileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.attachedFiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: PatientEntity;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'other' })
  category: '3d_scan' | 'xray' | 'picture' | 'document' | 'other';

  @Column({ type: 'varchar', length: 20 })
  fileType: string;

  @Column({ type: 'varchar', length: 50 })
  uploadDate: string;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes?: number;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', default: [] })
  relatedTeeth: number[];

  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

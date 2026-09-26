import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DentalPhotoEntity } from './dental-photo.entity';
import { BeforeAfterPairEntity } from './before-after-pair.entity';
import { AttachedFileEntity } from './attached-file.entity';
import { ToothRecordEntity } from '../../odontogram/entities/tooth-record.entity';
import { TeethSnapshotEntity } from '../../odontogram/entities/teeth-snapshot.entity';
import { MaintenanceDueEntity } from '../../odontogram/entities/maintenance-due.entity';
import { RecommendedServiceEntity } from '../../odontogram/entities/recommended-service.entity';
import { TreatmentLogEntity } from '../../treatments/entities/treatment-log.entity';

@Entity('patients')
export class PatientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 20 })
  dob: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 20, default: 'Other' })
  gender: 'Male' | 'Female' | 'Other';

  @Index()
  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'varchar', length: 20 })
  registeredDate: string; // YYYY-MM-DD

  @Column({ type: 'jsonb', default: [] })
  medicalAlerts: string[];

  @Column({ type: 'jsonb', default: [] })
  allergies: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  insuranceProvider?: string;

  @Column({ type: 'jsonb', nullable: true })
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };

  @OneToMany(() => ToothRecordEntity, (tooth) => tooth.patient, { cascade: true })
  teeth: ToothRecordEntity[];

  @OneToMany(() => TeethSnapshotEntity, (snapshot) => snapshot.patient, { cascade: true })
  teethSnapshots: TeethSnapshotEntity[];

  @OneToMany(() => DentalPhotoEntity, (photo) => photo.patient, { cascade: true })
  photos: DentalPhotoEntity[];

  @OneToMany(() => BeforeAfterPairEntity, (pair) => pair.patient, { cascade: true })
  beforeAfterPairs: BeforeAfterPairEntity[];

  @OneToMany(() => TreatmentLogEntity, (log) => log.patient, { cascade: true })
  treatmentLogs: TreatmentLogEntity[];

  @OneToMany(() => MaintenanceDueEntity, (due) => due.patient, { cascade: true })
  cleaningDues: MaintenanceDueEntity[];

  @OneToMany(() => RecommendedServiceEntity, (rec) => rec.patient, { cascade: true })
  recommendedServices: RecommendedServiceEntity[];

  @OneToMany(() => AttachedFileEntity, (file) => file.patient, { cascade: true })
  attachedFiles: AttachedFileEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

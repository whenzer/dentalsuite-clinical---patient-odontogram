import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RefreshTokenEntity } from '../../auth/entities/refresh-token.entity';
import { ClinicEntity } from '../../clinics/entities/clinic.entity';

export type UserRole = 'admin' | 'dentist' | 'receptionist' | 'hygienist' | 'assistant' | string;

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  clinicId?: string;

  @ManyToOne(() => ClinicEntity, (clinic) => clinic.staff, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'clinicId' })
  clinic?: ClinicEntity;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'dentist',
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 255, default: 'Dental Practitioner' })
  title: string;

  @Column({
    type: 'simple-array',
    default: 'patients,appointments,charting,treatments,photography',
  })
  permissions: string[];

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: 'active' | 'inactive';

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user, {
    cascade: true,
  })
  refreshTokens: RefreshTokenEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('staff_shifts')
export class StaffShiftEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  clinicId?: string;

  @Column({ type: 'varchar', length: 255 })
  doctorName: string;

  @Column({ type: 'varchar', length: 100 })
  role: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  licenseNumber?: string;

  @Column({ type: 'varchar', length: 100 })
  chairId: string;

  @Column({ type: 'varchar', length: 255 })
  chairName: string;

  @Column({ type: 'varchar', length: 20 })
  timeIn: string; // HH:mm

  @Column({ type: 'varchar', length: 20 })
  timeOut: string; // HH:mm

  @Column({ type: 'jsonb', default: [] })
  daysOfWeek: string[]; // ["Mon", "Tue", ...]

  @Index()
  @Column({ type: 'varchar', length: 30, default: 'active' })
  status: 'active' | 'on_break' | 'off_duty';

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone?: string;
}

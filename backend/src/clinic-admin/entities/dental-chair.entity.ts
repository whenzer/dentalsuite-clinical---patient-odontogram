import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('dental_chairs')
export class DentalChairEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  clinicId?: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  room: string;

  @Column({ type: 'varchar', length: 50 })
  type: 'General' | 'Surgical' | 'Hygiene' | 'Orthodontic' | 'Restorative';

  @Index()
  @Column({ type: 'varchar', length: 50, default: 'operational' })
  status: 'operational' | 'in_use' | 'maintenance';

  @Column({ type: 'jsonb', default: [] })
  equipment: string[];

  @Column({ type: 'text', nullable: true })
  notes?: string;
}

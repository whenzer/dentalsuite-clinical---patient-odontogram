import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('consumable_items')
export class ConsumableItemEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  brand: string;

  @Column({ type: 'varchar', length: 100 })
  dosage: string;

  @Column({ type: 'varchar', length: 50 })
  uom: string; // Unit of Measure: carpule, syringe, box, etc.

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  pricePhp: number;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'varchar', length: 100 })
  category: string;
}

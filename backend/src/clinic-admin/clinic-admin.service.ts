import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DentalChairEntity } from './entities/dental-chair.entity';
import { StaffShiftEntity } from './entities/staff-shift.entity';
import { ConsumableItemEntity } from './entities/consumable-item.entity';
import { TreatmentDeterminationEntity } from './entities/treatment-determination.entity';
import { ClinicalGateway } from '../realtime/clinical.gateway';

@Injectable()
export class ClinicAdminService {
  constructor(
    @InjectRepository(DentalChairEntity)
    private readonly chairsRepo: Repository<DentalChairEntity>,
    @InjectRepository(StaffShiftEntity)
    private readonly shiftsRepo: Repository<StaffShiftEntity>,
    @InjectRepository(ConsumableItemEntity)
    private readonly consumablesRepo: Repository<ConsumableItemEntity>,
    @InjectRepository(TreatmentDeterminationEntity)
    private readonly determinationsRepo: Repository<TreatmentDeterminationEntity>,
    private readonly realtimeGateway: ClinicalGateway,
  ) {}

  // --- Chairs ---
  async getChairs(clinicId?: string): Promise<DentalChairEntity[]> {
    return this.chairsRepo.find({
      where: clinicId ? { clinicId } : {},
      order: { name: 'ASC' },
    });
  }

  async saveChairs(clinicId: string | undefined, chairs: DentalChairEntity[]): Promise<DentalChairEntity[]> {
    if (clinicId) {
      chairs.forEach((c) => {
        c.clinicId = clinicId;
      });
    }
    return this.chairsRepo.save(chairs);
  }

  async updateChairStatus(id: string, status: 'operational' | 'in_use' | 'maintenance'): Promise<DentalChairEntity> {
    const chair = await this.chairsRepo.findOne({ where: { id } });
    if (!chair) {
      throw new NotFoundException(`Chair with ID ${id} not found`);
    }
    chair.status = status;
    const saved = await this.chairsRepo.save(chair);

    // Live WebSocket broadcast to all clinic screens
    this.realtimeGateway.broadcastChairStatusChange(id, status, saved);

    return saved;
  }

  // --- Shifts ---
  async getShifts(clinicId?: string): Promise<StaffShiftEntity[]> {
    return this.shiftsRepo.find({
      where: clinicId ? { clinicId } : {},
      order: { doctorName: 'ASC' },
    });
  }

  async saveShifts(clinicId: string | undefined, shifts: StaffShiftEntity[]): Promise<StaffShiftEntity[]> {
    if (clinicId) {
      shifts.forEach((s) => {
        s.clinicId = clinicId;
      });
    }
    return this.shiftsRepo.save(shifts);
  }

  // --- Consumables ---
  async getConsumables(clinicId?: string): Promise<ConsumableItemEntity[]> {
    return this.consumablesRepo.find({
      where: clinicId ? { clinicId } : {},
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async saveConsumables(clinicId: string | undefined, items: ConsumableItemEntity[]): Promise<ConsumableItemEntity[]> {
    if (clinicId) {
      items.forEach((i) => {
        i.clinicId = clinicId;
      });
    }
    return this.consumablesRepo.save(items);
  }

  async restockConsumable(id: string, quantityToAdd: number): Promise<ConsumableItemEntity> {
    const item = await this.consumablesRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Consumable item with ID ${id} not found`);
    }
    item.stockQuantity += quantityToAdd;
    return this.consumablesRepo.save(item);
  }

  // --- Determinations ---
  async getDeterminations(clinicId?: string): Promise<TreatmentDeterminationEntity[]> {
    return this.determinationsRepo.find({
      where: clinicId ? [{ clinicId }, { clinicId: null as any }] : {},
      order: { urgencyRank: 'ASC', treatmentName: 'ASC' },
    });
  }

  async saveDeterminations(clinicId: string | undefined, dets: TreatmentDeterminationEntity[]): Promise<TreatmentDeterminationEntity[]> {
    if (clinicId) {
      dets.forEach((d) => {
        d.clinicId = clinicId;
      });
    }
    return this.determinationsRepo.save(dets);
  }
}

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
  async getChairs(): Promise<DentalChairEntity[]> {
    return this.chairsRepo.find({ order: { name: 'ASC' } });
  }

  async saveChairs(chairs: DentalChairEntity[]): Promise<DentalChairEntity[]> {
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
  async getShifts(): Promise<StaffShiftEntity[]> {
    return this.shiftsRepo.find({ order: { doctorName: 'ASC' } });
  }

  async saveShifts(shifts: StaffShiftEntity[]): Promise<StaffShiftEntity[]> {
    return this.shiftsRepo.save(shifts);
  }

  // --- Consumables ---
  async getConsumables(): Promise<ConsumableItemEntity[]> {
    return this.consumablesRepo.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  async saveConsumables(items: ConsumableItemEntity[]): Promise<ConsumableItemEntity[]> {
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
  async getDeterminations(): Promise<TreatmentDeterminationEntity[]> {
    return this.determinationsRepo.find({ order: { urgencyRank: 'ASC', treatmentName: 'ASC' } });
  }

  async saveDeterminations(dets: TreatmentDeterminationEntity[]): Promise<TreatmentDeterminationEntity[]> {
    return this.determinationsRepo.save(dets);
  }
}

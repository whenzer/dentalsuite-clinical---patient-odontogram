import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
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
    return this.replaceClinicCollection(this.chairsRepo, clinicId, chairs);
  }

  async updateChairStatus(clinicId: string | undefined, id: string, status: 'operational' | 'in_use' | 'maintenance'): Promise<DentalChairEntity> {
    const chair = await this.chairsRepo.findOne({ where: clinicId ? { id, clinicId } : { id } });
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
    return this.replaceClinicCollection(this.shiftsRepo, clinicId, shifts);
  }

  // --- Consumables ---
  async getConsumables(clinicId?: string): Promise<ConsumableItemEntity[]> {
    return this.consumablesRepo.find({
      where: clinicId ? { clinicId } : {},
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async saveConsumables(clinicId: string | undefined, items: ConsumableItemEntity[]): Promise<ConsumableItemEntity[]> {
    return this.replaceClinicCollection(this.consumablesRepo, clinicId, items);
  }

  async restockConsumable(clinicId: string | undefined, id: string, quantityToAdd: number): Promise<ConsumableItemEntity> {
    const item = await this.consumablesRepo.findOne({ where: clinicId ? { id, clinicId } : { id } });
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
    return this.replaceClinicCollection(this.determinationsRepo, clinicId, dets);
  }

  private async replaceClinicCollection<T extends { id: string; clinicId?: string }>(
    repository: Repository<T>,
    clinicId: string | undefined,
    incoming: T[],
  ): Promise<T[]> {
    if (!clinicId) {
      throw new BadRequestException('A clinic context is required to modify clinic data');
    }

    const ids = incoming.map((item) => item.id).filter(Boolean);
    const existingWithMatchingIds = ids.length
      ? await repository.find({ where: { id: In(ids) } as any })
      : [];
    const foreignIds = existingWithMatchingIds
      .filter((item) => item.clinicId !== clinicId)
      .map((item) => item.id);
    if (foreignIds.length > 0) {
      throw new BadRequestException(`One or more records belong to another clinic: ${foreignIds.join(', ')}`);
    }

    const entities = incoming.map((item) => ({ ...item, clinicId }) as T);
    await repository.manager.transaction(async (manager) => {
      const scopedRepository = manager.getRepository(repository.target);
      if (ids.length > 0) {
        await scopedRepository.delete({ clinicId, id: Not(In(ids)) } as any);
      } else {
        await scopedRepository.delete({ clinicId } as any);
      }
      if (entities.length > 0) {
        await scopedRepository.save(entities);
      }
    });

    return repository.find({ where: { clinicId } as any });
  }
}

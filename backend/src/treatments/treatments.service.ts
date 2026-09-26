import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentLogEntity } from './entities/treatment-log.entity';
import { ConsumableItemEntity } from '../clinic-admin/entities/consumable-item.entity';
import { CreateTreatmentLogDto } from './dto/create-treatment-log.dto';
import { ClinicalGateway } from '../realtime/clinical.gateway';

@Injectable()
export class TreatmentsService {
  private readonly logger = new Logger(TreatmentsService.name);

  constructor(
    @InjectRepository(TreatmentLogEntity)
    private readonly treatmentsRepo: Repository<TreatmentLogEntity>,
    @InjectRepository(ConsumableItemEntity)
    private readonly consumablesRepo: Repository<ConsumableItemEntity>,
    private readonly realtimeGateway: ClinicalGateway,
  ) {}

  async findByPatient(patientId: string): Promise<TreatmentLogEntity[]> {
    return this.treatmentsRepo.find({
      where: { customerId: patientId },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TreatmentLogEntity> {
    const log = await this.treatmentsRepo.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Treatment log with ID ${id} not found`);
    }
    return log;
  }

  /**
   * Creates treatment log and automatically deducts consumable stock from clinic inventory
   */
  async create(dto: CreateTreatmentLogDto): Promise<TreatmentLogEntity> {
    const log = this.treatmentsRepo.create({
      ...dto,
      status: dto.status || 'Completed',
    });

    const savedLog = await this.treatmentsRepo.save(log);

    // If consumables were recorded during this treatment, deduct from inventory
    if (dto.consumables && Array.isArray(dto.consumables)) {
      for (const usage of dto.consumables) {
        if (usage.consumableId && usage.defaultQuantity) {
          const item = await this.consumablesRepo.findOne({
            where: { id: usage.consumableId },
          });

          if (item) {
            item.stockQuantity = Math.max(0, item.stockQuantity - usage.defaultQuantity);
            await this.consumablesRepo.save(item);
            this.logger.log(
              `Deducted ${usage.defaultQuantity} ${item.uom} of ${item.name}. Remaining: ${item.stockQuantity}`,
            );

            // If stock is critically low (e.g. <= 10), trigger WebSocket alert
            if (item.stockQuantity <= 10) {
              this.realtimeGateway.broadcastConsumableLowStock(item);
            }
          }
        }
      }
    }

    return savedLog;
  }

  async update(id: string, dto: Partial<CreateTreatmentLogDto>): Promise<TreatmentLogEntity> {
    const log = await this.findOne(id);
    Object.assign(log, dto);
    return this.treatmentsRepo.save(log);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const log = await this.findOne(id);
    await this.treatmentsRepo.remove(log);
    return { success: true };
  }
}

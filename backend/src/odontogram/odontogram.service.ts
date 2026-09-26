import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToothRecordEntity } from './entities/tooth-record.entity';
import { TeethSnapshotEntity } from './entities/teeth-snapshot.entity';
import { MaintenanceDueEntity } from './entities/maintenance-due.entity';
import { RecommendedServiceEntity } from './entities/recommended-service.entity';
import { DentalRulesService, TeethChartState, ToothData } from '../rules/dental-rules.service';
import { ClinicalGateway } from '../realtime/clinical.gateway';
import { UpdateToothDto } from './dto/update-tooth.dto';

@Injectable()
export class OdontogramService {
  constructor(
    @InjectRepository(ToothRecordEntity)
    private readonly teethRepo: Repository<ToothRecordEntity>,
    @InjectRepository(TeethSnapshotEntity)
    private readonly snapshotsRepo: Repository<TeethSnapshotEntity>,
    @InjectRepository(MaintenanceDueEntity)
    private readonly duesRepo: Repository<MaintenanceDueEntity>,
    @InjectRepository(RecommendedServiceEntity)
    private readonly recsRepo: Repository<RecommendedServiceEntity>,
    private readonly rulesService: DentalRulesService,
    private readonly realtimeGateway: ClinicalGateway,
  ) {}

  /**
   * Returns standard 32-tooth odontogram chart Record<number, ToothData>
   */
  async getPatientChart(patientId: string): Promise<TeethChartState> {
    const teeth = await this.teethRepo.find({
      where: { patientId },
      order: { toothNumber: 'ASC' },
    });

    const chart: TeethChartState = {} as TeethChartState;

    // Ensure all 32 teeth are present
    for (let num = 1; num <= 32; num++) {
      const found = teeth.find((t) => t.toothNumber === num);
      if (found) {
        chart[num] = {
          number: found.toothNumber,
          condition: found.condition,
          surfaces: found.surfaces || [],
          notes: found.notes,
          mobility: found.mobility,
          pocketDepthMm: found.pocketDepthMm,
          lastTreatedDate: found.lastTreatedDate,
          surfaceColors: found.surfaceColors,
        };
      } else {
        chart[num] = {
          number: num,
          condition: 'healthy',
          surfaces: [],
          mobility: 0,
          pocketDepthMm: 2,
        };
      }
    }

    return chart;
  }

  /**
   * Update a single tooth and recalculate recommended services
   */
  async updateTooth(patientId: string, dto: UpdateToothDto): Promise<TeethChartState> {
    let record = await this.teethRepo.findOne({
      where: { patientId, toothNumber: dto.number },
    });

    if (!record) {
      record = this.teethRepo.create({
        patientId,
        toothNumber: dto.number,
      });
    }

    record.condition = dto.condition;
    record.surfaces = dto.surfaces;
    record.notes = dto.notes;
    record.mobility = dto.mobility;
    record.pocketDepthMm = dto.pocketDepthMm;
    record.lastTreatedDate = dto.lastTreatedDate;
    record.surfaceColors = dto.surfaceColors;

    await this.teethRepo.save(record);

    const updatedChart = await this.getPatientChart(patientId);

    // Broadcast live WebSocket update to all connected stations
    this.realtimeGateway.broadcastOdontogramUpdate(patientId, updatedChart);

    // Recommendation refresh is secondary to keeping clinical charts in sync.
    void this.recalculateClinicalRecommendations(patientId, updatedChart).catch(() => undefined);

    return updatedChart;
  }

  /**
   * Bulk update 32-tooth chart
   */
  async bulkUpdateChart(patientId: string, chartData: TeethChartState): Promise<TeethChartState> {
    const toothNumbers = Object.keys(chartData).map(Number);

    for (const num of toothNumbers) {
      const tooth = chartData[num];
      let record = await this.teethRepo.findOne({
        where: { patientId, toothNumber: num },
      });

      if (!record) {
        record = this.teethRepo.create({
          patientId,
          toothNumber: num,
        });
      }

      record.condition = tooth.condition;
      record.surfaces = tooth.surfaces || [];
      record.notes = tooth.notes;
      record.mobility = tooth.mobility;
      record.pocketDepthMm = tooth.pocketDepthMm;
      record.lastTreatedDate = tooth.lastTreatedDate;
      record.surfaceColors = tooth.surfaceColors;

      await this.teethRepo.save(record);
    }

    const updatedChart = await this.getPatientChart(patientId);
    this.realtimeGateway.broadcastOdontogramUpdate(patientId, updatedChart);
    void this.recalculateClinicalRecommendations(patientId, updatedChart).catch(() => undefined);

    return updatedChart;
  }

  /**
   * Recalculates recommended services based on current tooth conditions
   */
  async recalculateClinicalRecommendations(patientId: string, chart: TeethChartState) {
    const existingDues = await this.duesRepo.find({ where: { patientId } });
    const generated = this.rulesService.generateRecommendedServices(chart, existingDues, patientId);

    // Wipe previous automated recommendations and replace with fresh clinical evaluation
    await this.recsRepo.delete({ customerId: patientId, addedToSchedule: false });

    for (const rec of generated) {
      await this.recsRepo.save(
        this.recsRepo.create({
          ...rec,
          id: undefined,
          customerId: patientId,
        }),
      );
    }
  }

  /**
   * Create and retrieve historic snapshots
   */
  async createSnapshot(patientId: string, visitTitle: string, notes?: string): Promise<TeethSnapshotEntity> {
    const chart = await this.getPatientChart(patientId);

    const snapshot = this.snapshotsRepo.create({
      patientId,
      visitTitle,
      notes,
      date: new Date().toISOString().split('T')[0],
      chart,
    });

    return this.snapshotsRepo.save(snapshot);
  }

  async getSnapshots(patientId: string): Promise<TeethSnapshotEntity[]> {
    return this.snapshotsRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  // Recommendations and dues
  async getRecommendations(patientId: string): Promise<RecommendedServiceEntity[]> {
    return this.recsRepo.find({
      where: { customerId: patientId },
      order: { estimatedFee: 'DESC' },
    });
  }

  async getMaintenanceDues(patientId: string): Promise<MaintenanceDueEntity[]> {
    return this.duesRepo.find({ where: { patientId } });
  }

  async updateMaintenanceDues(patientId: string, dues: Partial<MaintenanceDueEntity>[]): Promise<MaintenanceDueEntity[]> {
    await this.duesRepo.delete({ patientId });
    const evaluated = this.rulesService.evaluateMaintenanceDues(dues as any);
    const created = evaluated.map((d) => this.duesRepo.create({ ...d, patientId }));
    return this.duesRepo.save(created);
  }
}

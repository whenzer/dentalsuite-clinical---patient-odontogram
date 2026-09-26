import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity, AppointmentStatus } from './entities/appointment.entity';
import { AppointmentReminderLogEntity } from './entities/appointment-reminder-log.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ClinicalGateway } from '../realtime/clinical.gateway';

export interface DailyThroughputSummary {
  date: string;
  totalScheduled: number;
  completedCount: number;
  inProgressCount: number;
  upcomingCount: number;
  cancelledCount: number;
  targetPatients: number;
  completionRate: number;
  totalProduction: number;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentsRepo: Repository<AppointmentEntity>,
    @InjectRepository(AppointmentReminderLogEntity)
    private readonly reminderLogsRepo: Repository<AppointmentReminderLogEntity>,
    private readonly realtimeGateway: ClinicalGateway,
  ) {}

  async findAll(clinicId?: string, date?: string, doctorName?: string): Promise<AppointmentEntity[]> {
    const query = this.appointmentsRepo
      .createQueryBuilder('appt')
      .leftJoinAndSelect('appt.reminderLogs', 'reminderLogs')
      .orderBy('appt.date', 'ASC')
      .addOrderBy('appt.startTime', 'ASC');

    if (clinicId) {
      query.andWhere('appt.clinicId = :clinicId', { clinicId });
    }

    if (date) {
      query.andWhere('appt.date = :date', { date });
    }

    if (doctorName) {
      query.andWhere('appt.doctorName = :doctorName', { doctorName });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<AppointmentEntity> {
    const appt = await this.appointmentsRepo.findOne({
      where: { id },
      relations: ['reminderLogs'],
    });

    if (!appt) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appt;
  }

  /**
   * Conflict check: Ensures operatory or doctor is not double-booked
   */
  async checkConflicts(
    date: string,
    startTime: string,
    endTime: string,
    operatory: string,
    doctorName: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.appointmentsRepo
      .createQueryBuilder('appt')
      .where('appt.date = :date', { date })
      .andWhere('appt.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere(
        '((appt.startTime < :endTime AND appt.endTime > :startTime) AND (appt.operatory = :operatory OR appt.doctorName = :doctorName))',
        { startTime, endTime, operatory, doctorName },
      );

    if (excludeId) {
      query.andWhere('appt.id != :excludeId', { excludeId });
    }

    const conflicts = await query.getCount();
    return conflicts > 0;
  }

  async create(clinicId: string | undefined, dto: CreateAppointmentDto): Promise<AppointmentEntity> {
    const hasConflict = await this.checkConflicts(
      dto.date,
      dto.startTime,
      dto.endTime,
      dto.operatory,
      dto.doctorName,
    );

    if (hasConflict) {
      throw new BadRequestException(
        `Scheduling conflict: Either ${dto.operatory} or ${dto.doctorName} is already occupied during ${dto.startTime} - ${dto.endTime} on ${dto.date}.`,
      );
    }

    const appt = this.appointmentsRepo.create({
      ...dto,
      clinicId,
      status: dto.status || 'scheduled',
      automatedRemindersEnabled: dto.automatedRemindersEnabled !== false,
      reminderPreference: dto.reminderPreference || 'email',
    });

    const saved = await this.appointmentsRepo.save(appt);

    // Create automatic initial booking confirmation reminder log
    await this.reminderLogsRepo.save(
      this.reminderLogsRepo.create({
        appointmentId: saved.id,
        type: 'email',
        recipient: saved.customerEmail,
        timestamp: new Date().toISOString(),
        trigger: 'booking_confirmation',
        message: `Appointment scheduled for ${saved.customerName} on ${saved.date} at ${saved.startTime} with ${saved.doctorName}.`,
        status: 'delivered',
      }),
    );

    const fullAppt = await this.findOne(saved.id);
    this.realtimeGateway.broadcastAppointmentUpdate(fullAppt, 'created');
    return fullAppt;
  }

  async update(id: string, dto: Partial<CreateAppointmentDto>): Promise<AppointmentEntity> {
    const appt = await this.findOne(id);

    if (dto.date || dto.startTime || dto.endTime || dto.operatory || dto.doctorName) {
      const date = dto.date || appt.date;
      const startTime = dto.startTime || appt.startTime;
      const endTime = dto.endTime || appt.endTime;
      const operatory = dto.operatory || appt.operatory;
      const doctorName = dto.doctorName || appt.doctorName;

      const hasConflict = await this.checkConflicts(
        date,
        startTime,
        endTime,
        operatory,
        doctorName,
        id,
      );

      if (hasConflict) {
        throw new BadRequestException(
          `Scheduling conflict detected for updated time/chair/doctor allocation.`,
        );
      }
    }

    Object.assign(appt, dto);
    await this.appointmentsRepo.save(appt);

    const updated = await this.findOne(id);
    this.realtimeGateway.broadcastAppointmentUpdate(updated, 'updated');
    return updated;
  }

  async reschedule(
    id: string,
    newDate: string,
    newStartTime: string,
    newDurationMinutes?: number,
  ): Promise<AppointmentEntity> {
    const appt = await this.findOne(id);

    const duration = newDurationMinutes || appt.durationMinutes;
    // Calculate new endTime
    const [h, m] = newStartTime.split(':').map(Number);
    const endMinutesTotal = h * 60 + m + duration;
    const endH = Math.floor(endMinutesTotal / 60)
      .toString()
      .padStart(2, '0');
    const endM = (endMinutesTotal % 60).toString().padStart(2, '0');
    const newEndTime = `${endH}:${endM}`;

    const hasConflict = await this.checkConflicts(
      newDate,
      newStartTime,
      newEndTime,
      appt.operatory,
      appt.doctorName,
      id,
    );

    if (hasConflict) {
      throw new BadRequestException('Reschedule time slot has an existing booking conflict');
    }

    appt.rescheduledFrom = {
      date: appt.date,
      startTime: appt.startTime,
    };
    appt.date = newDate;
    appt.startTime = newStartTime;
    appt.durationMinutes = duration;
    appt.endTime = newEndTime;
    appt.status = 'scheduled';

    await this.appointmentsRepo.save(appt);

    // Log reschedule notice
    await this.reminderLogsRepo.save(
      this.reminderLogsRepo.create({
        appointmentId: appt.id,
        type: 'email',
        recipient: appt.customerEmail,
        timestamp: new Date().toISOString(),
        trigger: 'reschedule_notice',
        message: `Appointment rescheduled to ${newDate} at ${newStartTime}.`,
        status: 'delivered',
      }),
    );

    const updated = await this.findOne(id);
    this.realtimeGateway.broadcastAppointmentUpdate(updated, 'updated');
    return updated;
  }

  async updateStatus(id: string, status: AppointmentStatus, cancelReason?: string): Promise<AppointmentEntity> {
    const appt = await this.findOne(id);
    appt.status = status;
    if (cancelReason) {
      appt.cancelReason = cancelReason;
    }
    if (status === 'completed') {
      appt.sessionCompletedAt = new Date().toISOString();
    }

    await this.appointmentsRepo.save(appt);
    const updated = await this.findOne(id);
    this.realtimeGateway.broadcastAppointmentUpdate(updated, 'status_changed');
    return updated;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const appt = await this.findOne(id);
    await this.appointmentsRepo.remove(appt);
    this.realtimeGateway.broadcastAppointmentUpdate({ id }, 'cancelled');
    return { success: true };
  }

  /**
   * Daily throughput summary calculation
   */
  async getThroughputSummary(date: string): Promise<DailyThroughputSummary> {
    const appts = await this.appointmentsRepo.find({ where: { date } });

    const totalScheduled = appts.length;
    const completedCount = appts.filter((a) => a.status === 'completed').length;
    const inProgressCount = appts.filter((a) => a.status === 'in_progress').length;
    const cancelledCount = appts.filter((a) => a.status === 'cancelled').length;
    const upcomingCount = appts.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length;

    const targetPatients = 12; // Clinic daily standard target
    const completionRate = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;

    // Estimate daily production from procedures
    const totalProduction = completedCount * 3500;

    return {
      date,
      totalScheduled,
      completedCount,
      inProgressCount,
      upcomingCount,
      cancelledCount,
      targetPatients,
      completionRate,
      totalProduction,
    };
  }
}

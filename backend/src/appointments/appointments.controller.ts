import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus } from './entities/appointment.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async getAppointments(
    @CurrentUser() user: any,
    @Query('date') date?: string,
    @Query('doctorName') doctorName?: string,
  ) {
    return this.appointmentsService.findAll(user?.clinicId, date, doctorName);
  }

  @Get('throughput')
  async getThroughput(@Query('date') date: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.appointmentsService.getThroughputSummary(targetDate);
  }

  @Get(':id')
  async getAppointmentById(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @Roles('admin', 'dentist', 'receptionist', 'clinic_admin')
  async createAppointment(@CurrentUser() user: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user?.clinicId, dto);
  }

  @Put(':id')
  @Roles('admin', 'dentist', 'receptionist')
  async updateAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateAppointmentDto>,
  ) {
    return this.appointmentsService.update(id, dto);
  }

  @Put(':id/reschedule')
  @Roles('admin', 'dentist', 'receptionist')
  async rescheduleAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { date: string; startTime: string; durationMinutes?: number },
  ) {
    return this.appointmentsService.reschedule(
      id,
      body.date,
      body.startTime,
      body.durationMinutes,
    );
  }

  @Put(':id/status')
  @Roles('admin', 'dentist', 'receptionist')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: AppointmentStatus; cancelReason?: string },
  ) {
    return this.appointmentsService.updateStatus(id, body.status, body.cancelReason);
  }

  @Delete(':id')
  @Roles('admin', 'dentist', 'receptionist')
  async deleteAppointment(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.delete(id);
  }
}

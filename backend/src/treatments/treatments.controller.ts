import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentLogDto } from './dto/create-treatment-log.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api/v1/treatments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @Get('patient/:patientId')
  async getByPatient(@Param('patientId') patientId: string) {
    return this.treatmentsService.findByPatient(patientId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.treatmentsService.findOne(id);
  }

  @Post()
  @Roles('admin', 'dentist')
  async createTreatment(@Body() dto: CreateTreatmentLogDto) {
    return this.treatmentsService.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'dentist')
  async updateTreatment(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTreatmentLogDto>,
  ) {
    return this.treatmentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'dentist')
  async deleteTreatment(@Param('id') id: string) {
    return this.treatmentsService.delete(id);
  }
}

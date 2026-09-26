import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OdontogramService } from './odontogram.service';
import { UpdateToothDto } from './dto/update-tooth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api/v1/odontogram')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OdontogramController {
  constructor(private readonly odontogramService: OdontogramService) {}

  @Get(':patientId/chart')
  async getChart(@Param('patientId') patientId: string) {
    return this.odontogramService.getPatientChart(patientId);
  }

  @Put(':patientId/tooth')
  @Roles('admin', 'dentist')
  async updateTooth(
    @Param('patientId') patientId: string,
    @Body() dto: UpdateToothDto,
  ) {
    return this.odontogramService.updateTooth(patientId, dto);
  }

  @Put(':patientId/bulk')
  @Roles('admin', 'dentist')
  async bulkUpdate(
    @Param('patientId') patientId: string,
    @Body() chartData: any,
  ) {
    return this.odontogramService.bulkUpdateChart(patientId, chartData);
  }

  @Post(':patientId/snapshots')
  @Roles('admin', 'dentist')
  async createSnapshot(
    @Param('patientId') patientId: string,
    @Body() body: { visitTitle: string; notes?: string },
  ) {
    return this.odontogramService.createSnapshot(
      patientId,
      body.visitTitle,
      body.notes,
    );
  }

  @Get(':patientId/snapshots')
  async getSnapshots(@Param('patientId') patientId: string) {
    return this.odontogramService.getSnapshots(patientId);
  }

  @Get(':patientId/recommendations')
  async getRecommendations(@Param('patientId') patientId: string) {
    return this.odontogramService.getRecommendations(patientId);
  }

  @Get(':patientId/maintenance-dues')
  async getMaintenanceDues(@Param('patientId') patientId: string) {
    return this.odontogramService.getMaintenanceDues(patientId);
  }

  @Put(':patientId/maintenance-dues')
  @Roles('admin', 'dentist')
  async updateMaintenanceDues(
    @Param('patientId') patientId: string,
    @Body() dues: any[],
  ) {
    return this.odontogramService.updateMaintenanceDues(patientId, dues);
  }
}

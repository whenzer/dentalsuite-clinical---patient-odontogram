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
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api/v1/patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async getAllPatients(@Query('search') search?: string) {
    return this.patientsService.findAll(search);
  }

  @Get(':id')
  async getPatientById(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  @Roles('admin', 'dentist', 'receptionist')
  async createPatient(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'dentist', 'receptionist')
  async updatePatient(@Param('id') id: string, @Body() dto: Partial<CreatePatientDto>) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async deletePatient(@Param('id') id: string) {
    return this.patientsService.delete(id);
  }

  // Sub-resources: Photos
  @Post(':id/photos')
  @Roles('admin', 'dentist')
  async addPhoto(@Param('id') patientId: string, @Body() photoData: any) {
    return this.patientsService.addPhoto(patientId, photoData);
  }

  @Delete('photos/:photoId')
  @Roles('admin', 'dentist')
  async deletePhoto(@Param('photoId') photoId: string) {
    return this.patientsService.deletePhoto(photoId);
  }

  // Sub-resources: Before / After Pairs
  @Post(':id/before-after')
  @Roles('admin', 'dentist')
  async addBeforeAfter(@Param('id') patientId: string, @Body() pairData: any) {
    return this.patientsService.addBeforeAfterPair(patientId, pairData);
  }

  @Delete('before-after/:pairId')
  @Roles('admin', 'dentist')
  async deleteBeforeAfter(@Param('pairId') pairId: string) {
    return this.patientsService.deleteBeforeAfterPair(pairId);
  }

  // Sub-resources: Attached Files
  @Post(':id/files')
  @Roles('admin', 'dentist')
  async addAttachedFile(@Param('id') patientId: string, @Body() fileData: any) {
    return this.patientsService.addAttachedFile(patientId, fileData);
  }

  @Delete('files/:fileId')
  @Roles('admin', 'dentist')
  async deleteAttachedFile(@Param('fileId') fileId: string) {
    return this.patientsService.deleteAttachedFile(fileId);
  }
}

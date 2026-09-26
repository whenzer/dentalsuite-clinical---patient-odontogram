import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { RegisterStaffDto, UpdateStaffDto, ResetPasswordDto } from './dto/register-staff.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/clinic')
@UseGuards(JwtAuthGuard)
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  private extractClinicId(user: any): string {
    const clinicId = user.clinicId || user.sub || user.id;
    if (!clinicId) {
      throw new ForbiddenException('No clinic association found for this session');
    }
    return clinicId;
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    const clinicId = this.extractClinicId(user);
    return this.clinicsService.getProfile(clinicId);
  }

  @Put('profile')
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateClinicDto) {
    const clinicId = this.extractClinicId(user);
    return this.clinicsService.updateProfile(clinicId, dto);
  }

  @Get('staff')
  async getStaff(@CurrentUser() user: any) {
    const clinicId = this.extractClinicId(user);
    return this.clinicsService.getStaff(clinicId);
  }

  @Post('staff')
  async registerStaff(@CurrentUser() user: any, @Body() dto: RegisterStaffDto) {
    const clinicId = this.extractClinicId(user);
    return this.clinicsService.registerStaff(clinicId, dto);
  }

  @Put('staff/:id')
  async updateStaff(
    @CurrentUser() user: any,
    @Param('id') staffId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    const clinicId = this.extractClinicId(user);
    return this.clinicsService.updateStaff(clinicId, staffId, dto);
  }

  @Post('staff/:id/password')
  async resetStaffPassword(
    @CurrentUser() user: any,
    @Param('id') staffId: string,
    @Body() dto: ResetPasswordDto,
  ) {
    const clinicId = this.extractClinicId(user);
    return this.clinicsService.resetStaffPassword(clinicId, staffId, dto.password);
  }

  @Delete('staff/:id')
  async deleteStaff(@CurrentUser() user: any, @Param('id') staffId: string) {
    const clinicId = this.extractClinicId(user);
    return this.clinicsService.deleteStaff(clinicId, staffId);
  }
}

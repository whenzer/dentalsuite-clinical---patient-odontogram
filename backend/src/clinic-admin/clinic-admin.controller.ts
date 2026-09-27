import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ClinicAdminService } from './clinic-admin.service';
import { DentalChairEntity } from './entities/dental-chair.entity';
import { StaffShiftEntity } from './entities/staff-shift.entity';
import { ConsumableItemEntity } from './entities/consumable-item.entity';
import { TreatmentDeterminationEntity } from './entities/treatment-determination.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicAdminController {
  constructor(private readonly adminService: ClinicAdminService) {}

  // Chairs
  @Get('chairs')
  async getChairs(@CurrentUser() user: any) {
    return this.adminService.getChairs(user?.clinicId);
  }

  @Put('chairs')
  @Roles('admin', 'clinic_admin')
  async saveChairs(@CurrentUser() user: any, @Body() chairs: DentalChairEntity[]) {
    return this.adminService.saveChairs(user?.clinicId, chairs);
  }

  @Put('chairs/:id/status')
  @Roles('admin', 'dentist', 'receptionist', 'clinic_admin')
  async updateChairStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: 'operational' | 'in_use' | 'maintenance',
  ) {
    return this.adminService.updateChairStatus(user?.clinicId, id, status);
  }

  // Shifts
  @Get('shifts')
  async getShifts(@CurrentUser() user: any) {
    return this.adminService.getShifts(user?.clinicId);
  }

  @Put('shifts')
  @Roles('admin', 'clinic_admin')
  async saveShifts(@CurrentUser() user: any, @Body() shifts: StaffShiftEntity[]) {
    return this.adminService.saveShifts(user?.clinicId, shifts);
  }

  // Consumables
  @Get('consumables')
  async getConsumables(@CurrentUser() user: any) {
    return this.adminService.getConsumables(user?.clinicId);
  }

  @Put('consumables')
  @Roles('admin', 'dentist', 'clinic_admin')
  async saveConsumables(@CurrentUser() user: any, @Body() items: ConsumableItemEntity[]) {
    return this.adminService.saveConsumables(user?.clinicId, items);
  }

  @Post('consumables/:id/restock')
  @Roles('admin', 'dentist', 'clinic_admin')
  async restockConsumable(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.adminService.restockConsumable(user?.clinicId, id, quantity);
  }

  // Treatment Determinations
  @Get('determinations')
  async getDeterminations(@CurrentUser() user: any) {
    return this.adminService.getDeterminations(user?.clinicId);
  }

  @Put('determinations')
  @Roles('admin', 'clinic_admin')
  async saveDeterminations(@CurrentUser() user: any, @Body() dets: TreatmentDeterminationEntity[]) {
    return this.adminService.saveDeterminations(user?.clinicId, dets);
  }
}

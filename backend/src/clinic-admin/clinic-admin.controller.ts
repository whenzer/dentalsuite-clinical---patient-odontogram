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

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicAdminController {
  constructor(private readonly adminService: ClinicAdminService) {}

  // Chairs
  @Get('chairs')
  async getChairs() {
    return this.adminService.getChairs();
  }

  @Put('chairs')
  @Roles('admin')
  async saveChairs(@Body() chairs: DentalChairEntity[]) {
    return this.adminService.saveChairs(chairs);
  }

  @Put('chairs/:id/status')
  @Roles('admin', 'dentist', 'receptionist')
  async updateChairStatus(
    @Param('id') id: string,
    @Body('status') status: 'operational' | 'in_use' | 'maintenance',
  ) {
    return this.adminService.updateChairStatus(id, status);
  }

  // Shifts
  @Get('shifts')
  async getShifts() {
    return this.adminService.getShifts();
  }

  @Put('shifts')
  @Roles('admin')
  async saveShifts(@Body() shifts: StaffShiftEntity[]) {
    return this.adminService.saveShifts(shifts);
  }

  // Consumables
  @Get('consumables')
  async getConsumables() {
    return this.adminService.getConsumables();
  }

  @Put('consumables')
  @Roles('admin', 'dentist')
  async saveConsumables(@Body() items: ConsumableItemEntity[]) {
    return this.adminService.saveConsumables(items);
  }

  @Post('consumables/:id/restock')
  @Roles('admin', 'dentist')
  async restockConsumable(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.adminService.restockConsumable(id, quantity);
  }

  // Treatment Determinations
  @Get('determinations')
  async getDeterminations() {
    return this.adminService.getDeterminations();
  }

  @Put('determinations')
  @Roles('admin')
  async saveDeterminations(@Body() dets: TreatmentDeterminationEntity[]) {
    return this.adminService.saveDeterminations(dets);
  }
}

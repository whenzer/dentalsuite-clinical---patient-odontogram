import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicAdminService } from './clinic-admin.service';
import { ClinicAdminController } from './clinic-admin.controller';
import { DentalChairEntity } from './entities/dental-chair.entity';
import { StaffShiftEntity } from './entities/staff-shift.entity';
import { ConsumableItemEntity } from './entities/consumable-item.entity';
import { TreatmentDeterminationEntity } from './entities/treatment-determination.entity';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DentalChairEntity,
      StaffShiftEntity,
      ConsumableItemEntity,
      TreatmentDeterminationEntity,
    ]),
    RealtimeModule,
  ],
  controllers: [ClinicAdminController],
  providers: [ClinicAdminService],
  exports: [ClinicAdminService],
})
export class ClinicAdminModule {}

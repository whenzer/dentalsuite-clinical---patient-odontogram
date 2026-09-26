import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './database.config';
import { SeedService } from './seed/seed.service';
import { UserEntity } from '../users/entities/user.entity';
import { DentalChairEntity } from '../clinic-admin/entities/dental-chair.entity';
import { StaffShiftEntity } from '../clinic-admin/entities/staff-shift.entity';
import { ConsumableItemEntity } from '../clinic-admin/entities/consumable-item.entity';
import { TreatmentDeterminationEntity } from '../clinic-admin/entities/treatment-determination.entity';
import { PatientEntity } from '../patients/entities/patient.entity';
import { ToothRecordEntity } from '../odontogram/entities/tooth-record.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { RulesModule } from '../rules/rules.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      DentalChairEntity,
      StaffShiftEntity,
      ConsumableItemEntity,
      TreatmentDeterminationEntity,
      PatientEntity,
      ToothRecordEntity,
      AppointmentEntity,
    ]),
    RulesModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}

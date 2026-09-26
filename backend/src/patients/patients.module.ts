import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PatientEntity } from './entities/patient.entity';
import { DentalPhotoEntity } from './entities/dental-photo.entity';
import { BeforeAfterPairEntity } from './entities/before-after-pair.entity';
import { AttachedFileEntity } from './entities/attached-file.entity';
import { ToothRecordEntity } from '../odontogram/entities/tooth-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PatientEntity,
      DentalPhotoEntity,
      BeforeAfterPairEntity,
      AttachedFileEntity,
      ToothRecordEntity,
    ]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}

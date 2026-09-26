import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicEntity } from './entities/clinic.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicEntity, UserEntity])],
  controllers: [ClinicsController],
  providers: [ClinicsService],
  exports: [ClinicsService, TypeOrmModule],
})
export class ClinicsModule {}

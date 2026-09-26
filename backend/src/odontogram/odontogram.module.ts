import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OdontogramService } from './odontogram.service';
import { OdontogramController } from './odontogram.controller';
import { ToothRecordEntity } from './entities/tooth-record.entity';
import { TeethSnapshotEntity } from './entities/teeth-snapshot.entity';
import { MaintenanceDueEntity } from './entities/maintenance-due.entity';
import { RecommendedServiceEntity } from './entities/recommended-service.entity';
import { RulesModule } from '../rules/rules.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ToothRecordEntity,
      TeethSnapshotEntity,
      MaintenanceDueEntity,
      RecommendedServiceEntity,
    ]),
    RulesModule,
    RealtimeModule,
  ],
  controllers: [OdontogramController],
  providers: [OdontogramService],
  exports: [OdontogramService],
})
export class OdontogramModule {}

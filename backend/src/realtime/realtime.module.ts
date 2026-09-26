import { Module } from '@nestjs/common';
import { ClinicalGateway } from './clinical.gateway';

@Module({
  providers: [ClinicalGateway],
  exports: [ClinicalGateway],
})
export class RealtimeModule {}

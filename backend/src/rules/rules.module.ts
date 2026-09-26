import { Module } from '@nestjs/common';
import { DentalRulesService } from './dental-rules.service';
import { UrgencyRulesService } from './urgency-rules.service';

@Module({
  providers: [DentalRulesService, UrgencyRulesService],
  exports: [DentalRulesService, UrgencyRulesService],
})
export class RulesModule {}

import { Injectable } from '@nestjs/common';
import { RecommendedService } from './dental-rules.service';

export type UrgencyLevel = 'Emergency' | 'LongProcedure' | 'MaintenanceElective';

@Injectable()
export class UrgencyRulesService {
  classifyUrgency(service: Partial<RecommendedService>): UrgencyLevel {
    if (service.urgencyGroup) return service.urgencyGroup;
    if (service.priority === 'urgent') return 'Emergency';
    if (
      service.priority === 'high' ||
      service.category === 'Oral Surgery' ||
      service.category === 'Endodontic' ||
      (service.durationMinutes && service.durationMinutes >= 60)
    ) {
      return 'LongProcedure';
    }
    return 'MaintenanceElective';
  }

  sortTreatmentsByUrgency(items: RecommendedService[]): RecommendedService[] {
    const priorityWeights: Record<string, number> = {
      urgent: 4,
      high: 3,
      routine: 2,
      cosmetic: 1,
    };

    return [...items].sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 0;
      const weightB = priorityWeights[b.priority] || 0;
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      return (b.estimatedFee || 0) - (a.estimatedFee || 0);
    });
  }
}

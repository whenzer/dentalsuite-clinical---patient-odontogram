import { Injectable } from '@nestjs/common';

export type ToothNumber = number;
export type ToothCondition =
  | 'healthy'
  | 'missing'
  | 'growing_impacted'
  | 'erupted'
  | 'rotted'
  | 'small_cavity'
  | 'moderate_cavity'
  | 'large_cavity'
  | 'weared_dentin'
  | 'filling'
  | 'crown'
  | 'root_canal'
  | 'implant'
  | 'veneer'
  | 'calculus_tartar';

export type ToothSurface = 'occlusal' | 'mesial' | 'distal' | 'buccal' | 'lingual' | 'incisal';

export interface ToothData {
  number: ToothNumber;
  condition: ToothCondition;
  surfaces: ToothSurface[];
  notes?: string;
  mobility?: 0 | 1 | 2 | 3;
  pocketDepthMm?: number;
  lastTreatedDate?: string;
  surfaceColors?: Record<string, string>;
}

export type TeethChartState = Record<ToothNumber, ToothData>;

export interface MaintenanceDue {
  type: string;
  lastDoneDate: string;
  intervalMonths: number;
  nextDueDate: string;
  status: 'up_to_date' | 'due_soon' | 'overdue';
  notes?: string;
}

export interface RecommendedService {
  id?: string;
  customerId: string;
  title: string;
  reason: string;
  priority: 'urgent' | 'high' | 'routine' | 'cosmetic';
  category: string;
  suggestedNextVisitTimeframe: string;
  estimatedFee: number;
  relatedTeeth: ToothNumber[];
  preemptive: boolean;
  addedToSchedule?: boolean;
  urgencyGroup?: 'Emergency' | 'LongProcedure' | 'MaintenanceElective';
  durationMinutes?: number;
  determinationId?: string;
}

@Injectable()
export class DentalRulesService {
  evaluateMaintenanceDues(dues: MaintenanceDue[]): MaintenanceDue[] {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return dues.map((due) => {
      const nextDue = new Date(due.nextDueDate);
      let status: 'up_to_date' | 'due_soon' | 'overdue' = 'up_to_date';

      if (nextDue < now) {
        status = 'overdue';
      } else if (nextDue <= thirtyDaysFromNow) {
        status = 'due_soon';
      }

      return { ...due, status };
    });
  }

  generateRecommendedServices(
    chart: TeethChartState,
    cleaningDues: MaintenanceDue[],
    patientId: string,
  ): RecommendedService[] {
    const recs: RecommendedService[] = [];

    // Group teeth by specific clinical conditions
    const rottedTeeth: ToothNumber[] = [];
    const smallCavities: ToothNumber[] = [];
    const moderateCavities: ToothNumber[] = [];
    const largeCavities: ToothNumber[] = [];
    const impactedTeeth: ToothNumber[] = [];
    const missingTeeth: ToothNumber[] = [];
    const calculusTeeth: ToothNumber[] = [];
    const deepPockets: ToothNumber[] = [];
    const mobileTeeth: ToothNumber[] = [];
    const rootCanalTeethWithoutCrown: ToothNumber[] = [];
    const wearedTeeth: ToothNumber[] = [];

    Object.values(chart || {}).forEach((tooth) => {
      const num = tooth.number;
      switch (tooth.condition) {
        case 'rotted':
          rottedTeeth.push(num);
          break;
        case 'large_cavity':
          largeCavities.push(num);
          break;
        case 'moderate_cavity':
          moderateCavities.push(num);
          break;
        case 'small_cavity':
          smallCavities.push(num);
          break;
        case 'growing_impacted':
          impactedTeeth.push(num);
          break;
        case 'missing':
          missingTeeth.push(num);
          break;
        case 'calculus_tartar':
          calculusTeeth.push(num);
          break;
        case 'weared_dentin':
          wearedTeeth.push(num);
          break;
        case 'root_canal':
          rootCanalTeethWithoutCrown.push(num);
          break;
      }

      if (tooth.pocketDepthMm && tooth.pocketDepthMm >= 5) {
        deepPockets.push(num);
      }
      if (tooth.mobility && tooth.mobility >= 2) {
        mobileTeeth.push(num);
      }
    });

    // 1. Rotted / Grossly Carious (Urgent)
    if (rottedTeeth.length > 0) {
      recs.push({
        customerId: patientId,
        title: `Surgical Extraction / Core Build-up & Endodontic Evaluation (#${rottedTeeth.join(', #')})`,
        reason: 'Severe coronal destruction with pulp exposure risks infection and acute abscess.',
        priority: 'urgent',
        category: 'Oral Surgery',
        suggestedNextVisitTimeframe: 'Immediate (Within 48-72 Hours)',
        estimatedFee: rottedTeeth.length * 3500,
        relatedTeeth: rottedTeeth,
        preemptive: false,
        urgencyGroup: 'Emergency',
        durationMinutes: rottedTeeth.length * 45,
      });
    }

    // 2. Large Cavities / Near Pulp (High)
    if (largeCavities.length > 0) {
      recs.push({
        customerId: patientId,
        title: `Deep Caries Excavation & Indirect Pulp Cap (#${largeCavities.join(', #')})`,
        reason: 'Extensive decay nearing pulp chamber. Immediate excavation required to prevent root canal therapy.',
        priority: 'high',
        category: 'Restorative',
        suggestedNextVisitTimeframe: 'Within 1-2 Weeks',
        estimatedFee: largeCavities.length * 2800,
        relatedTeeth: largeCavities,
        preemptive: false,
        urgencyGroup: 'LongProcedure',
        durationMinutes: largeCavities.length * 45,
      });
    }

    // 3. Moderate Cavities (Routine/High)
    if (moderateCavities.length > 0) {
      recs.push({
        customerId: patientId,
        title: `Multi-surface Composite Resin Restorations (#${moderateCavities.join(', #')})`,
        reason: 'Active dentinal carious lesions requiring prompt debridement and aesthetic bonded restorations.',
        priority: 'high',
        category: 'Restorative',
        suggestedNextVisitTimeframe: 'Within 2-3 Weeks',
        estimatedFee: moderateCavities.length * 2000,
        relatedTeeth: moderateCavities,
        preemptive: false,
        urgencyGroup: 'MaintenanceElective',
        durationMinutes: moderateCavities.length * 30,
      });
    }

    // 4. Small Cavities (Routine)
    if (smallCavities.length > 0) {
      recs.push({
        customerId: patientId,
        title: `Conservative Micro-hybrid Composite Fillings (#${smallCavities.join(', #')})`,
        reason: 'Early pit and fissure enamel decay amenable to minimally invasive bonded restorations.',
        priority: 'routine',
        category: 'Restorative',
        suggestedNextVisitTimeframe: 'Next Scheduled Visit (Within 1 Month)',
        estimatedFee: smallCavities.length * 1500,
        relatedTeeth: smallCavities,
        preemptive: false,
        urgencyGroup: 'MaintenanceElective',
        durationMinutes: smallCavities.length * 25,
      });
    }

    // 5. Deep Periodontal Pockets (High)
    if (deepPockets.length > 0) {
      recs.push({
        customerId: patientId,
        title: `Quadrant Scaling & Root Planing with Local Antimicrobial (#${deepPockets.join(', #')})`,
        reason: 'Periodontal probing depth ≥ 5mm with subgingival calculus and attachment loss.',
        priority: 'high',
        category: 'Periodontic',
        suggestedNextVisitTimeframe: 'Within 2 Weeks',
        estimatedFee: 4500,
        relatedTeeth: deepPockets,
        preemptive: false,
        urgencyGroup: 'LongProcedure',
        durationMinutes: 60,
      });
    }

    // 6. Impacted 3rd Molars
    if (impactedTeeth.length > 0) {
      recs.push({
        customerId: patientId,
        title: `Surgical Odontectomy for Impacted Molars (#${impactedTeeth.join(', #')})`,
        reason: 'Impaction presents risk of pericoronitis, crowding, and root resorption of adjacent teeth.',
        priority: 'routine',
        category: 'Oral Surgery',
        suggestedNextVisitTimeframe: 'Within 1-2 Months',
        estimatedFee: impactedTeeth.length * 8500,
        relatedTeeth: impactedTeeth,
        preemptive: true,
        urgencyGroup: 'LongProcedure',
        durationMinutes: impactedTeeth.length * 60,
      });
    }

    // 7. Missing Teeth (Prosthodontic rehabilitation)
    if (missingTeeth.length > 0 && missingTeeth.length <= 6) {
      recs.push({
        customerId: patientId,
        title: `Prosthodontic Consultation: Implant vs Fixed Bridge (#${missingTeeth.join(', #')})`,
        reason: 'Prevent supra-eruption of opposing dentition, mesial drifting, and posterior bite collapse.',
        priority: 'routine',
        category: 'Restorative',
        suggestedNextVisitTimeframe: 'Next Visit (Within 1 Month)',
        estimatedFee: 1500,
        relatedTeeth: missingTeeth,
        preemptive: true,
        urgencyGroup: 'MaintenanceElective',
        durationMinutes: 30,
      });
    }

    // 8. Routine Prophylaxis / Calculus
    const cleaningDue = (cleaningDues || []).find((d) => d.type.includes('Cleaning') || d.type.includes('Prophylaxis'));
    if (calculusTeeth.length > 0 || (cleaningDue && cleaningDue.status !== 'up_to_date')) {
      recs.push({
        customerId: patientId,
        title: 'Full Mouth Ultrasonic Scaling & Air Polishing Prophylaxis',
        reason: cleaningDue?.status === 'overdue'
          ? 'Maintenance cleaning is past due. Supragingival plaque and calculus removal needed.'
          : 'Plaque and calculus deposits detected along gingival margins.',
        priority: cleaningDue?.status === 'overdue' ? 'high' : 'routine',
        category: 'Preventive',
        suggestedNextVisitTimeframe: cleaningDue?.status === 'overdue' ? 'Within 1-2 Weeks' : 'Next 6-Month Cycle',
        estimatedFee: 1800,
        relatedTeeth: calculusTeeth,
        preemptive: true,
        urgencyGroup: 'MaintenanceElective',
        durationMinutes: 45,
      });
    }

    return recs;
  }
}

import {
  MaintenanceDue,
  RecommendedService,
  TeethChartState,
  ToothNumber,
} from '../types';
import { TOOTH_METADATA } from '../data/toothMetadata';

/**
 * Calculates current status (up_to_date, due_soon, overdue) based on date
 */
export function evaluateMaintenanceDues(dues: MaintenanceDue[]): MaintenanceDue[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dues.map((due) => {
    const dueDate = new Date(due.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let status: 'up_to_date' | 'due_soon' | 'overdue' = 'up_to_date';
    if (diffDays < 0) {
      status = 'overdue';
    } else if (diffDays <= 30) {
      status = 'due_soon';
    }

    return {
      ...due,
      status,
    };
  });
}

/**
 * Intelligent recommendation engine: computes treatment & preemptive maintenance
 * based on current teeth statuses and maintenance dues
 */
export function generateRecommendedServices(
  chart: TeethChartState,
  dues: MaintenanceDue[],
  customerId: string
): RecommendedService[] {
  const recommendations: RecommendedService[] = [];

  // Group teeth by specific conditions
  const rottedTeeth: ToothNumber[] = [];
  const largeCavities: ToothNumber[] = [];
  const moderateCavities: ToothNumber[] = [];
  const smallCavities: ToothNumber[] = [];
  const wearedDentinTeeth: ToothNumber[] = [];
  const calculusTeeth: ToothNumber[] = [];
  const impactedTeeth: ToothNumber[] = [];
  const missingTeeth: ToothNumber[] = [];

  Object.values(chart).forEach((tooth) => {
    switch (tooth.condition) {
      case 'rotted':
        rottedTeeth.push(tooth.number);
        break;
      case 'large_cavity':
        largeCavities.push(tooth.number);
        break;
      case 'moderate_cavity':
        moderateCavities.push(tooth.number);
        break;
      case 'small_cavity':
        smallCavities.push(tooth.number);
        break;
      case 'weared_dentin':
        wearedDentinTeeth.push(tooth.number);
        break;
      case 'calculus_tartar':
        calculusTeeth.push(tooth.number);
        break;
      case 'growing_impacted':
        impactedTeeth.push(tooth.number);
        break;
      case 'missing':
        missingTeeth.push(tooth.number);
        break;
    }
  });

  // 1. Rotted / Gross Caries (Critical / Urgent Treatment)
  if (rottedTeeth.length > 0) {
    recommendations.push({
      id: `rec-rotted-${Date.now()}-1`,
      customerId,
      title: `Emergency Endodontic or Surgical Extraction Protocol`,
      reason: `Severe structural breakdown and bacterial necrosis detected on tooth #${rottedTeeth.join(', #')}. Immediate evaluation required to prevent systemic infection or abscess.`,
      priority: 'urgent',
      category: 'Endodontics & Oral Surgery',
      suggestedNextVisitTimeframe: 'Immediate (Within 48-72 hours)',
      estimatedFee: rottedTeeth.length * 450,
      relatedTeeth: rottedTeeth,
      preemptive: false,
    });
  }

  // 2. Large Cavities (High Priority Active Treatment)
  if (largeCavities.length > 0) {
    recommendations.push({
      id: `rec-large-cav-${Date.now()}-2`,
      customerId,
      title: `Deep Caries Removal & Full Restoration / Pulp Therapy`,
      reason: `Deep dentin decay close to the pulp on tooth #${largeCavities.join(', #')}. Needs prompt restorative intervention (indirect pulp cap + composite or crown) before irreversible pulpitis develops.`,
      priority: 'high',
      category: 'Restorative Dentistry',
      suggestedNextVisitTimeframe: 'Next 1-2 Weeks',
      estimatedFee: largeCavities.length * 280,
      relatedTeeth: largeCavities,
      preemptive: false,
    });
  }

  // 3. Moderate Cavities (Standard Restorative)
  if (moderateCavities.length > 0) {
    recommendations.push({
      id: `rec-mod-cav-${Date.now()}-3`,
      customerId,
      title: `Direct Composite Resin Restoration`,
      reason: `Active enamel-dentin decay on tooth #${moderateCavities.join(', #')}. Conservative excavation and tooth-colored composite filling recommended to arrest decay.`,
      priority: 'high',
      category: 'Restorative Dentistry',
      suggestedNextVisitTimeframe: 'Next 2-4 Weeks',
      estimatedFee: moderateCavities.length * 180,
      relatedTeeth: moderateCavities,
      preemptive: false,
    });
  }

  // 4. Weared Down Dentin (Preemptive Maintenance & Preventive Protection)
  if (wearedDentinTeeth.length > 0) {
    recommendations.push({
      id: `rec-wear-${Date.now()}-4`,
      customerId,
      title: `Preemptive Occlusal Night Guard & Dentin Desensitizing`,
      reason: `Severe attrition/erosion exposing yellow dentin on tooth #${wearedDentinTeeth.join(', #')}. Fabricating a custom laboratory night guard will halt nocturnal bruxism grinding and prevent further enamel micro-fractures.`,
      priority: 'high',
      category: 'Preemptive Maintenance',
      suggestedNextVisitTimeframe: 'Next 2 Weeks (Impression Visit)',
      estimatedFee: 420,
      relatedTeeth: wearedDentinTeeth,
      preemptive: true,
    });
  }

  // 5. Small / Incipient Cavities (Preemptive & Remineralization)
  if (smallCavities.length > 0) {
    recommendations.push({
      id: `rec-small-cav-${Date.now()}-5`,
      customerId,
      title: `Preventive Fluoride Therapy & Pit and Fissure Sealants`,
      reason: `Early incipient demineralization detected on tooth #${smallCavities.join(', #')}. Preemptive remineralization varnish or micro-invasive resin sealants can arrest caries without drilling.`,
      priority: 'routine',
      category: 'Preventive Care',
      suggestedNextVisitTimeframe: 'At Next Routine Cleaning Visit',
      estimatedFee: smallCavities.length * 75,
      relatedTeeth: smallCavities,
      preemptive: true,
    });
  }

  // 6. Calculus & Cleaning Maintenance (Due or Gum Inflammation)
  const evaluatedDues = evaluateMaintenanceDues(dues);
  const cleaningDue = evaluatedDues.find((d) => d.type.includes('Cleaning') || d.type.includes('Prophylaxis'));
  const isCleaningDueOrOverdue = cleaningDue && (cleaningDue.status === 'overdue' || cleaningDue.status === 'due_soon');

  if (calculusTeeth.length > 0 || isCleaningDueOrOverdue) {
    const isOverdue = cleaningDue?.status === 'overdue';
    recommendations.push({
      id: `rec-clean-${Date.now()}-6`,
      customerId,
      title: calculusTeeth.length > 3 ? `Full-Mouth Ultrasonic Scaling & Root Debridement` : `Routine Prophylaxis & Periodontal Maintenance`,
      reason: isOverdue
        ? `Cleaning and maintenance is overdue (${cleaningDue?.nextDueDate}). Bacterial tartar accumulation requires ultrasonic debridement to prevent pocket deepening and periodontal bone loss.`
        : `Calculus buildup detected around tooth #${calculusTeeth.join(', #') || 'anterior lingual arch'}. Preventive debridement and polishing recommended.`,
      priority: isOverdue ? 'high' : 'routine',
      category: 'Hygiene & Preventive',
      suggestedNextVisitTimeframe: isOverdue ? 'Within 1-2 Weeks' : 'Next Scheduled Recall Date',
      estimatedFee: calculusTeeth.length > 3 ? 220 : 130,
      relatedTeeth: calculusTeeth,
      preemptive: true,
    });
  }

  // 7. Growing / Impacted Teeth
  if (impactedTeeth.length > 0) {
    recommendations.push({
      id: `rec-impacted-${Date.now()}-7`,
      customerId,
      title: `Panoramic Radiograph (OPG) & Wisdom Tooth Assessment`,
      reason: `Erupting or impacted position on tooth #${impactedTeeth.join(', #')}. Evaluate risk of root resorption on adjacent molars or pericoronitis.`,
      priority: 'routine',
      category: 'Diagnostic & Oral Surgery',
      suggestedNextVisitTimeframe: 'Next Scheduled Visit',
      estimatedFee: 150,
      relatedTeeth: impactedTeeth,
      preemptive: true,
    });
  }

  // 8. Missing Teeth (Rehabilitative Prosthodontics)
  if (missingTeeth.length > 0) {
    recommendations.push({
      id: `rec-missing-${Date.now()}-8`,
      customerId,
      title: `Dental Implant or Fixed Bridge Prosthetic Consultation`,
      reason: `Edentulous gap at tooth #${missingTeeth.join(', #')}. Replacement recommended to restore masticatory efficiency and prevent tilting/supra-eruption of opposing teeth.`,
      priority: 'cosmetic',
      category: 'Prosthodontics & Implants',
      suggestedNextVisitTimeframe: 'Next Available Consult',
      estimatedFee: 1800,
      relatedTeeth: missingTeeth,
      preemptive: false,
    });
  }

  return recommendations;
}

export interface ToothDifference {
  toothNumber: ToothNumber;
  toothName: string;
  previousCondition: string;
  currentCondition: string;
  changeType: 'worsened' | 'improved' | 'new_issue' | 'treated' | 'unchanged';
  description: string;
}

/**
 * Compares two historical teeth snapshots for a customer to track changes across visits
 */
export function compareTeethSnapshots(
  oldChart: TeethChartState,
  newChart: TeethChartState
): {
  differences: ToothDifference[];
  summary: {
    totalChanged: number;
    improvedOrTreated: number;
    newIssuesOrWorsened: number;
  };
} {
  const differences: ToothDifference[] = [];
  let improvedOrTreated = 0;
  let newIssuesOrWorsened = 0;

  for (let num = 1; num <= 32; num++) {
    const oldTooth = oldChart[num];
    const newTooth = newChart[num];
    if (!oldTooth || !newTooth) continue;

    if (oldTooth.condition !== newTooth.condition) {
      let changeType: ToothDifference['changeType'] = 'unchanged';
      let description = '';

      const isOldIssue = ['rotted', 'large_cavity', 'moderate_cavity', 'small_cavity', 'weared_dentin', 'calculus_tartar'].includes(oldTooth.condition);
      const isNewRestored = ['filling', 'crown', 'root_canal', 'implant', 'veneer', 'healthy'].includes(newTooth.condition);
      const isNewIssue = ['rotted', 'large_cavity', 'moderate_cavity', 'small_cavity', 'weared_dentin', 'calculus_tartar'].includes(newTooth.condition);

      if (isOldIssue && isNewRestored) {
        changeType = 'treated';
        improvedOrTreated++;
        description = `Successfully treated and restored from ${oldTooth.condition.replace('_', ' ')} to ${newTooth.condition}.`;
      } else if (!isOldIssue && isNewIssue) {
        changeType = 'new_issue';
        newIssuesOrWorsened++;
        description = `New condition detected: developed ${newTooth.condition.replace('_', ' ')}.`;
      } else if (isOldIssue && isNewIssue) {
        changeType = 'worsened';
        newIssuesOrWorsened++;
        description = `Condition progressed from ${oldTooth.condition.replace('_', ' ')} to ${newTooth.condition.replace('_', ' ')}.`;
      } else {
        changeType = 'improved';
        improvedOrTreated++;
        description = `Status changed from ${oldTooth.condition.replace('_', ' ')} to ${newTooth.condition.replace('_', ' ')}.`;
      }

      differences.push({
        toothNumber: num,
        toothName: TOOTH_METADATA[num]?.shortName || `Tooth #${num}`,
        previousCondition: oldTooth.condition,
        currentCondition: newTooth.condition,
        changeType,
        description,
      });
    }
  }

  return {
    differences,
    summary: {
      totalChanged: differences.length,
      improvedOrTreated,
      newIssuesOrWorsened,
    },
  };
}

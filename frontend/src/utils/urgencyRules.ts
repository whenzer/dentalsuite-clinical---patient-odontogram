import { UrgencyLevel, TreatmentDetermination } from '../types';
import { INITIAL_TREATMENT_DETERMINATIONS } from '../data/adminMasterData';

/**
 * Format any number to Philippine Peso (PHP ₱)
 */
export function formatPHP(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₱0';
  }
  return `₱${Math.round(amount).toLocaleString('en-PH')}`;
}

export function formatPHPRange(min: number, max: number): string {
  return `${formatPHP(min)} – ${formatPHP(max)}`;
}

export interface UrgencyInfo {
  group: UrgencyLevel;
  rank: 1 | 2 | 3;
  label: string;
  badgeClass: string;
  dotClass: string;
  cardBorderClass: string;
  tagline: string;
}

export const URGENCY_TIERS: Record<UrgencyLevel, UrgencyInfo> = {
  Emergency: {
    group: 'Emergency',
    rank: 1,
    label: 'Emergency Case',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    dotClass: 'bg-rose-500 animate-pulse',
    cardBorderClass: 'border-rose-300 bg-rose-50/30',
    tagline: 'Top Priority · Immediate Confirmation & Booking',
  },
  LongProcedure: {
    group: 'LongProcedure',
    rank: 2,
    label: 'Priority Case (Long Procedure)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    dotClass: 'bg-amber-500',
    cardBorderClass: 'border-amber-200 bg-amber-50/20',
    tagline: '1 hr – Longer Operatory Chair Time',
  },
  MaintenanceElective: {
    group: 'MaintenanceElective',
    rank: 3,
    label: 'Maintenance / Elective',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
    dotClass: 'bg-emerald-500',
    cardBorderClass: 'border-emerald-200 bg-emerald-50/15',
    tagline: '15 – 45 mins (1 hr Max)',
  },
};

/**
 * Given a treatment or procedure name, match it to the clinical urgency hierarchy
 */
export function getTreatmentUrgency(treatmentName: string = ''): UrgencyInfo {
  const norm = treatmentName.toLowerCase();

  // Tier 1: Emergency Cases (Top Priority)
  // Trauma, Severe Pain, Tooth Fracture, Avulsions, Lock jaw Management
  if (
    norm.includes('trauma') ||
    norm.includes('severe pain') ||
    norm.includes('acute pain') ||
    norm.includes('toothache') ||
    norm.includes('fracture') ||
    norm.includes('broken tooth') ||
    norm.includes('avulsion') ||
    norm.includes('knocked out') ||
    norm.includes('lock jaw') ||
    norm.includes('lockjaw') ||
    norm.includes('trismus') ||
    norm.includes('tmj reduction') ||
    norm.includes('emergency') ||
    norm.includes('abscess')
  ) {
    return URGENCY_TIERS.Emergency;
  }

  // Tier 2: Long Procedures (Priority Cases) (1hr-longer)
  // Root Canal Treatment (RCT), Crown Preparations, Prosthodontics (Denture Preparations),
  // Odontectomy, Surgery, Aesthetic Restorations, Onlays, Inlays,
  // Orthodontic Strap-Up (Installation), Orthodontic Appliance Removal
  if (
    norm.includes('root canal') ||
    norm.includes('rct') ||
    norm.includes('endodontic') ||
    norm.includes('crown prep') ||
    norm.includes('crown') ||
    norm.includes('prosthodontic') ||
    norm.includes('denture prep') ||
    norm.includes('odontectomy') ||
    norm.includes('impacted') ||
    norm.includes('wisdom tooth') ||
    norm.includes('surgery') ||
    norm.includes('surgical') ||
    norm.includes('aesthetic restoration') ||
    norm.includes('veneer') ||
    norm.includes('smile makeover') ||
    norm.includes('onlay') ||
    norm.includes('inlay') ||
    norm.includes('strap-up') ||
    norm.includes('bracket installation') ||
    norm.includes('appliance removal') ||
    norm.includes('debonding') ||
    norm.includes('implant')
  ) {
    return URGENCY_TIERS.LongProcedure;
  }

  // Tier 3: Maintenance/Elective Procedures (15-45 mins, 1hr MAX)
  // Whitening, Oral Prophylaxis, Orthodontic Adjustment, Prosthodontic (Denture) Trials,
  // Minor Restorations, Consultation, Fluoride Applications
  return URGENCY_TIERS.MaintenanceElective;
}

/**
 * Match a treatment string to the full Determination record from the master list
 */
export function findDetermination(
  treatmentName: string = '',
  determinationsList: TreatmentDetermination[] = INITIAL_TREATMENT_DETERMINATIONS
): TreatmentDetermination | undefined {
  const norm = treatmentName.toLowerCase().trim();
  // Exact match
  const exact = determinationsList.find(
    (d) => d.treatmentName.toLowerCase() === norm
  );
  if (exact) return exact;

  // Keyword match
  const partial = determinationsList.find(
    (d) =>
      norm.includes(d.treatmentName.toLowerCase()) ||
      d.treatmentName.toLowerCase().includes(norm)
  );
  if (partial) return partial;

  // Fallback by urgency
  const urgency = getTreatmentUrgency(treatmentName);
  return determinationsList.find((d) => d.urgencyGroup === urgency.group);
}

/**
 * Sorts treatments by urgency hierarchy:
 * Highest importance first (Emergency = 1, LongProcedure = 2, MaintenanceElective = 3)
 */
export function sortTreatmentsByUrgency<T>(items: T[]): T[] {
  return [...items].sort((itemA: any, itemB: any) => {
    const nameA = itemA?.title || itemA?.procedureName || itemA?.treatmentName || '';
    const nameB = itemB?.title || itemB?.procedureName || itemB?.treatmentName || '';

    const urgA = itemA?.urgencyGroup
      ? URGENCY_TIERS[itemA.urgencyGroup as UrgencyLevel]
      : getTreatmentUrgency(nameA);
    const urgB = itemB?.urgencyGroup
      ? URGENCY_TIERS[itemB.urgencyGroup as UrgencyLevel]
      : getTreatmentUrgency(nameB);

    if (urgA && urgB && urgA.rank !== urgB.rank) {
      return urgA.rank - urgB.rank; // 1 before 2 before 3
    }

    return nameA.localeCompare(nameB);
  });
}

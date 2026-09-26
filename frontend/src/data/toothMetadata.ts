import { ToothCondition, ToothNumber } from '../types';

export interface ToothInfo {
  number: ToothNumber;
  name: string;
  shortName: string;
  arch: 'upper' | 'lower';
  quadrant: 'UR' | 'UL' | 'LL' | 'LR';
  type: 'molar' | 'premolar' | 'canine' | 'incisor';
  isWisdom: boolean;
}

export const TOOTH_METADATA: Record<ToothNumber, ToothInfo> = {
  1: { number: 1, name: 'Upper Right 3rd Molar (Wisdom)', shortName: 'UR 3rd Molar', arch: 'upper', quadrant: 'UR', type: 'molar', isWisdom: true },
  2: { number: 2, name: 'Upper Right 2nd Molar', shortName: 'UR 2nd Molar', arch: 'upper', quadrant: 'UR', type: 'molar', isWisdom: false },
  3: { number: 3, name: 'Upper Right 1st Molar', shortName: 'UR 1st Molar', arch: 'upper', quadrant: 'UR', type: 'molar', isWisdom: false },
  4: { number: 4, name: 'Upper Right 2nd Premolar', shortName: 'UR 2nd Premolar', arch: 'upper', quadrant: 'UR', type: 'premolar', isWisdom: false },
  5: { number: 5, name: 'Upper Right 1st Premolar', shortName: 'UR 1st Premolar', arch: 'upper', quadrant: 'UR', type: 'premolar', isWisdom: false },
  6: { number: 6, name: 'Upper Right Canine (Eye Tooth)', shortName: 'UR Canine', arch: 'upper', quadrant: 'UR', type: 'canine', isWisdom: false },
  7: { number: 7, name: 'Upper Right Lateral Incisor', shortName: 'UR Lat Incisor', arch: 'upper', quadrant: 'UR', type: 'incisor', isWisdom: false },
  8: { number: 8, name: 'Upper Right Central Incisor', shortName: 'UR Central Inc', arch: 'upper', quadrant: 'UR', type: 'incisor', isWisdom: false },
  9: { number: 9, name: 'Upper Left Central Incisor', shortName: 'UL Central Inc', arch: 'upper', quadrant: 'UL', type: 'incisor', isWisdom: false },
  10: { number: 10, name: 'Upper Left Lateral Incisor', shortName: 'UL Lat Incisor', arch: 'upper', quadrant: 'UL', type: 'incisor', isWisdom: false },
  11: { number: 11, name: 'Upper Left Canine (Eye Tooth)', shortName: 'UL Canine', arch: 'upper', quadrant: 'UL', type: 'canine', isWisdom: false },
  12: { number: 12, name: 'Upper Left 1st Premolar', shortName: 'UL 1st Premolar', arch: 'upper', quadrant: 'UL', type: 'premolar', isWisdom: false },
  13: { number: 13, name: 'Upper Left 2nd Premolar', shortName: 'UL 2nd Premolar', arch: 'upper', quadrant: 'UL', type: 'premolar', isWisdom: false },
  14: { number: 14, name: 'Upper Left 1st Molar', shortName: 'UL 1st Molar', arch: 'upper', quadrant: 'UL', type: 'molar', isWisdom: false },
  15: { number: 15, name: 'Upper Left 2nd Molar', shortName: 'UL 2nd Molar', arch: 'upper', quadrant: 'UL', type: 'molar', isWisdom: false },
  16: { number: 16, name: 'Upper Left 3rd Molar (Wisdom)', shortName: 'UL 3rd Molar', arch: 'upper', quadrant: 'UL', type: 'molar', isWisdom: true },

  17: { number: 17, name: 'Lower Left 3rd Molar (Wisdom)', shortName: 'LL 3rd Molar', arch: 'lower', quadrant: 'LL', type: 'molar', isWisdom: true },
  18: { number: 18, name: 'Lower Left 2nd Molar', shortName: 'LL 2nd Molar', arch: 'lower', quadrant: 'LL', type: 'molar', isWisdom: false },
  19: { number: 19, name: 'Lower Left 1st Molar', shortName: 'LL 1st Molar', arch: 'lower', quadrant: 'LL', type: 'molar', isWisdom: false },
  20: { number: 20, name: 'Lower Left 2nd Premolar', shortName: 'LL 2nd Premolar', arch: 'lower', quadrant: 'LL', type: 'premolar', isWisdom: false },
  21: { number: 21, name: 'Lower Left 1st Premolar', shortName: 'LL 1st Premolar', arch: 'lower', quadrant: 'LL', type: 'premolar', isWisdom: false },
  22: { number: 22, name: 'Lower Left Canine', shortName: 'LL Canine', arch: 'lower', quadrant: 'LL', type: 'canine', isWisdom: false },
  23: { number: 23, name: 'Lower Left Lateral Incisor', shortName: 'LL Lat Incisor', arch: 'lower', quadrant: 'LL', type: 'incisor', isWisdom: false },
  24: { number: 24, name: 'Lower Left Central Incisor', shortName: 'LL Central Inc', arch: 'lower', quadrant: 'LL', type: 'incisor', isWisdom: false },
  25: { number: 25, name: 'Lower Right Central Incisor', shortName: 'LR Central Inc', arch: 'lower', quadrant: 'LR', type: 'incisor', isWisdom: false },
  26: { number: 26, name: 'Lower Right Lateral Incisor', shortName: 'LR Lat Incisor', arch: 'lower', quadrant: 'LR', type: 'incisor', isWisdom: false },
  27: { number: 27, name: 'Lower Right Canine', shortName: 'LR Canine', arch: 'lower', quadrant: 'LR', type: 'canine', isWisdom: false },
  28: { number: 28, name: 'Lower Right 1st Premolar', shortName: 'LR 1st Premolar', arch: 'lower', quadrant: 'LR', type: 'premolar', isWisdom: false },
  29: { number: 29, name: 'Lower Right 2nd Premolar', shortName: 'LR 2nd Premolar', arch: 'lower', quadrant: 'LR', type: 'premolar', isWisdom: false },
  30: { number: 30, name: 'Lower Right 1st Molar', shortName: 'LR 1st Molar', arch: 'lower', quadrant: 'LR', type: 'molar', isWisdom: false },
  31: { number: 31, name: 'Lower Right 2nd Molar', shortName: 'LR 2nd Molar', arch: 'lower', quadrant: 'LR', type: 'molar', isWisdom: false },
  32: { number: 32, name: 'Lower Right 3rd Molar (Wisdom)', shortName: 'LR 3rd Molar', arch: 'lower', quadrant: 'LR', type: 'molar', isWisdom: true },
};

export interface ConditionConfig {
  id: ToothCondition;
  label: string;
  category: 'normal' | 'decay' | 'wear' | 'restored' | 'developmental';
  badgeBg: string;
  badgeText: string;
  chartFill: string;
  chartStroke: string;
  description: string;
  patientExplanation: string; // Friendly text to explain to customers
  urgency: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export const CONDITION_CONFIGS: Record<ToothCondition, ConditionConfig> = {
  healthy: {
    id: 'healthy',
    label: 'Healthy / Sound',
    category: 'normal',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    chartFill: '#ecfdf5', // emerald-50
    chartStroke: '#10b981', // emerald-500
    description: 'Enamel and surrounding tissues are intact without detectable pathology.',
    patientExplanation: 'Great news! This tooth is completely sound, clean, and shows no signs of decay or wear.',
    urgency: 'none',
  },
  missing: {
    id: 'missing',
    label: 'Missing Tooth',
    category: 'normal',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-700',
    chartFill: '#f1f5f9',
    chartStroke: '#94a3b8',
    description: 'Tooth is absent due to prior extraction, congenitally missing, or trauma.',
    patientExplanation: 'This tooth space is currently vacant. Replacing it with an implant or bridge prevents adjacent teeth from drifting.',
    urgency: 'medium',
  },
  growing_impacted: {
    id: 'growing_impacted',
    label: 'Growing / Impacted',
    category: 'developmental',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    chartFill: '#e0e7ff',
    chartStroke: '#6366f1',
    description: 'Tooth is emerging or blocked beneath gum/bone (common with 3rd molars).',
    patientExplanation: 'The tooth is trapped or coming in at an angle. It may crowd other teeth or trap bacteria under the gum flap.',
    urgency: 'medium',
  },
  erupted: {
    id: 'erupted',
    label: 'Partially Erupted',
    category: 'developmental',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    chartFill: '#e0f2fe',
    chartStroke: '#0284c7',
    description: 'Partially broken through gumline; prone to pericoronitis.',
    patientExplanation: 'Partially visible above the gum. Needs extra gentle hygiene to prevent gum inflammation.',
    urgency: 'low',
  },
  rotted: {
    id: 'rotted',
    label: 'Rotted / Gross Caries',
    category: 'decay',
    badgeBg: 'bg-rose-900',
    badgeText: 'text-rose-100',
    chartFill: '#881337', // rose-900
    chartStroke: '#4c0519',
    description: 'Severe structural destruction with bacterial necrosis of crown/root.',
    patientExplanation: 'Severe breakdown of the tooth structure from deep bacterial infection. Urgent intervention is needed to eliminate infection and relieve pain.',
    urgency: 'critical',
  },
  large_cavity: {
    id: 'large_cavity',
    label: 'Very Large Cavity',
    category: 'decay',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    chartFill: '#ffe4e6',
    chartStroke: '#e11d48',
    description: 'Deep dentinal decay nearing or involving the dental pulp nerve.',
    patientExplanation: 'A deep cavity that has eaten through the outer enamel into the inner sensitive dentin. Prompt filling or root canal is needed before it affects the nerve.',
    urgency: 'high',
  },
  moderate_cavity: {
    id: 'moderate_cavity',
    label: 'Moderate Cavity',
    category: 'decay',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    chartFill: '#fef3c7',
    chartStroke: '#f59e0b',
    description: 'Caries extending past the enamel into mid-dentin.',
    patientExplanation: 'A noticeable cavity that has spread into the softer dentin layer. A tooth-colored composite filling will restore its strength.',
    urgency: 'medium',
  },
  small_cavity: {
    id: 'small_cavity',
    label: 'Small / Incipient Cavity',
    category: 'decay',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
    chartFill: '#fef9c3',
    chartStroke: '#ca8a04',
    description: 'Early demineralization or enamel fissure caries.',
    patientExplanation: 'An early-stage spot of enamel breakdown. Can often be halted with preventive fluoride, sealing, or a minor conservative restoration.',
    urgency: 'low',
  },
  weared_dentin: {
    id: 'weared_dentin',
    label: 'Weared Down Dentin (Attrition)',
    category: 'wear',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    chartFill: '#ffedd5',
    chartStroke: '#ea580c',
    description: 'Loss of protective enamel exposing yellow sensitive dentin due to bruxism/grinding or acid erosion.',
    patientExplanation: 'The outer protective enamel has worn away from night grinding, clenching, or acid, exposing the softer yellow dentin underneath. A night guard and bonding will protect it.',
    urgency: 'high',
  },
  filling: {
    id: 'filling',
    label: 'Composite / Amalgam Filling',
    category: 'restored',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    chartFill: '#dbeafe',
    chartStroke: '#3b82f6',
    description: 'Existing dental restoration in good functional standing.',
    patientExplanation: 'This tooth has a previously placed filling that is currently stable and sealing the tooth.',
    urgency: 'none',
  },
  crown: {
    id: 'crown',
    label: 'Crown / Cap',
    category: 'restored',
    badgeBg: 'bg-amber-200',
    badgeText: 'text-amber-900',
    chartFill: '#fde68a',
    chartStroke: '#d97706',
    description: 'Full-coverage ceramic/zirconia/metal crown encasing the tooth.',
    patientExplanation: 'Protected by a full custom crown covering the entire tooth surface.',
    urgency: 'none',
  },
  root_canal: {
    id: 'root_canal',
    label: 'Root Canal (Treated)',
    category: 'restored',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    chartFill: '#f3e8ff',
    chartStroke: '#9333ea',
    description: 'Endodontically treated root canals with gutta-percha seal.',
    patientExplanation: 'The nerve canal inside has been disinfected and sealed to cure previous infection.',
    urgency: 'none',
  },
  implant: {
    id: 'implant',
    label: 'Dental Implant',
    category: 'restored',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    chartFill: '#ccfbf1',
    chartStroke: '#0d9488',
    description: 'Titanium or zirconia osteointegrated root replacement fixture.',
    patientExplanation: 'A permanent artificial tooth root securely anchored in the jawbone supporting a natural-looking crown.',
    urgency: 'none',
  },
  veneer: {
    id: 'veneer',
    label: 'Porcelain Veneer',
    category: 'restored',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-800',
    chartFill: '#fce7f3',
    chartStroke: '#db2777',
    description: 'Cosmetic porcelain laminate bonded to facial surface.',
    patientExplanation: 'A custom porcelain shell bonded to the front for enhanced aesthetics.',
    urgency: 'none',
  },
  calculus_tartar: {
    id: 'calculus_tartar',
    label: 'Calculus / Gingivitis',
    category: 'decay',
    badgeBg: 'bg-lime-100',
    badgeText: 'text-lime-800',
    chartFill: '#ecfccb',
    chartStroke: '#65a30d',
    description: 'Hardened supra/subgingival tartar deposit with gum inflammation.',
    patientExplanation: 'Bacterial plaque that has hardened into tartar along the gum margin, causing redness or bleeding. Requires ultrasonic hygiene cleaning.',
    urgency: 'medium',
  },
};

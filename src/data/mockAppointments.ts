import { Appointment } from '../types';

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const DOCTOR_OPTIONS = [
  'General Dental Surgeon',
  'Lead Orthodontist',
  'Periodontal Specialist',
  'Licensed Dental Hygienist',
];

export const OPERATORY_OPTIONS = [
  'Operatory 1 (Hygiene & Preventive)',
  'Operatory 2 (Restorative & Endodontics)',
  'Operatory 3 (Surgical & Implants)',
];

export const PROCEDURE_CATEGORIES = [
  'Preventive',
  'Restorative',
  'Endodontic',
  'Periodontic',
  'Oral Surgery',
  'Cosmetic',
  'Orthodontic',
  'Consultation',
] as const;

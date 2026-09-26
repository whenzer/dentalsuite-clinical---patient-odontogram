export type ToothNumber = number; // 1 to 32 (Universal Numbering System)

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
  pocketDepthMm?: number; // Periodontal probing depth
  lastTreatedDate?: string;
  surfaceColors?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    center?: string;
  };
}

export type TeethChartState = Record<ToothNumber, ToothData>;

export interface TeethSnapshot {
  id: string;
  date: string;
  visitTitle: string;
  notes?: string;
  chart: TeethChartState;
}

export interface DentalPhoto {
  id: string;
  customerId: string;
  url: string; // base64 or url
  caption: string;
  category: 'intraoral' | 'extraoral' | 'xray' | 'pre_op' | 'post_op' | 'smile' | 'other';
  takenAt: string;
  relatedTeeth?: ToothNumber[];
  stage?: 'before' | 'after' | 'standard';
}

export interface BeforeAfterPair {
  id: string;
  customerId: string;
  title: string;
  beforePhotoId: string;
  afterPhotoId: string;
  dateCreated: string;
  notes?: string;
  relatedTeeth?: ToothNumber[];
}

export type UrgencyLevel = 'Emergency' | 'LongProcedure' | 'MaintenanceElective';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'dentist' | 'receptionist' | 'hygienist' | 'assistant' | 'clinic_admin' | string;
  title: string;
  avatarUrl?: string;
  clinicId?: string;
  clinicName?: string;
  accountType?: 'staff' | 'clinic';
  permissions?: string[];
  status?: 'active' | 'inactive';
}

export interface ClinicProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  registrationNumber?: string;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffMember {
  id: string;
  clinicId?: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'dentist' | 'receptionist' | 'hygienist' | 'assistant' | string;
  title: string;
  permissions: string[];
  status: 'active' | 'inactive';
  avatarUrl?: string;
  createdAt?: string;
}

export interface DentalChair {
  id: string;
  name: string; // e.g. "Chair 1 (Hygiene & Preventive)"
  room: string; // e.g. "Suite 101"
  type: 'General' | 'Surgical' | 'Hygiene' | 'Orthodontic' | 'Restorative';
  status: 'operational' | 'in_use' | 'maintenance';
  equipment: string[];
  notes?: string;
}

export interface StaffShift {
  id: string;
  doctorName: string;
  role: string;
  licenseNumber?: string;
  chairId: string;
  chairName: string;
  timeIn: string; // e.g. "08:00"
  timeOut: string; // e.g. "17:00"
  daysOfWeek: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri"]
  status: 'active' | 'on_break' | 'off_duty';
  contactPhone?: string;
}

export interface ConsumableItem {
  id: string;
  name: string;
  brand: string;
  dosage: string; // e.g. "1.8 mL", "4g syringe", "500g"
  uom: string; // Unit of Measure: "carpule", "syringe", "bag", "box", "mL", "g", "unit"
  pricePhp: number;
  stockQuantity: number;
  category: string;
}

export interface ConsumableUsage {
  consumableId: string;
  consumableName: string;
  brand: string;
  standardDosage: string;
  uom: string;
  unitPricePhp: number;
  defaultQuantity: number;
}

export interface TreatmentDetermination {
  id: string;
  treatmentName: string;
  urgencyGroup: UrgencyLevel;
  urgencyRank: 1 | 2 | 3; // 1 = Emergency (Top Priority), 2 = Long Procedures (Priority Cases), 3 = Maintenance/Elective
  minAmountPhp: number;
  maxAmountPhp: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  commonlyUsedConsumables: ConsumableUsage[];
  description?: string;
  indication?: string;
}

export interface TreatmentLog {
  id: string;
  customerId: string;
  date: string;
  doctorName: string;
  category: 'Preventive' | 'Restorative' | 'Endodontic' | 'Periodontic' | 'Oral Surgery' | 'Cosmetic' | 'Orthodontic';
  procedureName: string;
  teethInvolved: ToothNumber[];
  clinicalNotes: string;
  cost: number;
  status: 'Completed' | 'In Progress' | 'Planned';
  snapshotId?: string; // Links to tooth status at the time of treatment
  urgencyGroup?: UrgencyLevel;
  durationMinutes?: number;
  determinationId?: string;
  consumables?: ConsumableUsage[];
  minAmountPhp?: number;
  maxAmountPhp?: number;
}

export interface MaintenanceDue {
  type: 'Prophylaxis (Cleaning)' | 'Periodontal Deep Maintenance' | 'Fluoride Varnish' | 'Night Guard Check' | 'Orthodontic Retainer' | 'Whitening Touch-up';
  lastDoneDate: string;
  intervalMonths: number;
  nextDueDate: string;
  status: 'up_to_date' | 'due_soon' | 'overdue';
  notes?: string;
}

export interface RecommendedService {
  id: string;
  customerId: string;
  title: string;
  reason: string;
  priority: 'urgent' | 'high' | 'routine' | 'cosmetic';
  category: string;
  suggestedNextVisitTimeframe: string; // e.g. "Within 1-2 weeks", "Next 6-Month Cleaning"
  estimatedFee: number;
  relatedTeeth: ToothNumber[];
  preemptive: boolean; // Is it preemptive maintenance vs active treatment
  addedToSchedule?: boolean;
  urgencyGroup?: UrgencyLevel;
  durationMinutes?: number;
  determinationId?: string;
  consumables?: ConsumableUsage[];
  minAmountPhp?: number;
  maxAmountPhp?: number;
}

export interface AttachedFile {
  id: string;
  name: string;
  category: '3d_scan' | 'xray' | 'picture' | 'document' | 'other';
  fileType: string; // 'STL' | 'PLY' | 'DICOM' | 'PNG' | 'JPG' | 'PDF'
  uploadDate: string;
  sizeBytes?: number;
  url: string;
  notes?: string;
  relatedTeeth?: ToothNumber[];
  thumbnailUrl?: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  avatarUrl?: string;
  registeredDate: string;
  medicalAlerts: string[];
  allergies: string[];
  insuranceProvider?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  cleaningDues: MaintenanceDue[];
  teethChart: TeethChartState;
  teethSnapshots: TeethSnapshot[];
  photos: DentalPhoto[];
  beforeAfterPairs: BeforeAfterPair[];
  treatmentLogs: TreatmentLog[];
  recommendedServices: RecommendedService[];
  attachedFiles?: AttachedFile[];
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ReminderType = 'email' | 'sms' | 'both';

export interface AppointmentReminderLog {
  id: string;
  type: 'email' | 'sms';
  recipient: string;
  timestamp: string;
  trigger: 'automated_48h' | 'automated_24h' | 'automated_2h' | 'manual_staff' | 'booking_confirmation' | 'reschedule_notice' | 'cancellation_notice';
  message: string;
  status: 'sent' | 'delivered';
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "09:00")
  durationMinutes: number; // 15, 30, 45, 60, 90
  endTime: string; // HH:mm (e.g. "10:00")
  doctorName: string; // e.g. "Dr. Aris Thorne, DDS" | "Dr. Elena Vance, DMD" | "Lisa Ray, RDH"
  operatory: string; // e.g. "Operatory 1 (Hygiene)" | "Operatory 2 (Restorative)" | "Operatory 3 (Surgical)"
  procedureCategory: 'Preventive' | 'Restorative' | 'Endodontic' | 'Periodontic' | 'Oral Surgery' | 'Cosmetic' | 'Orthodontic' | 'Consultation';
  procedureName: string;
  relatedTeeth?: ToothNumber[];
  status: AppointmentStatus;
  notes?: string;
  cancelReason?: string;
  rescheduledFrom?: {
    date: string;
    startTime: string;
  };
  reminderPreference: ReminderType;
  reminderLogs: AppointmentReminderLog[];
  automatedRemindersEnabled: boolean;
  // Clinical session & photo ops integration
  sessionLogged?: boolean;
  treatmentLogId?: string;
  sessionPhotosCount?: number;
  sessionPhotoIds?: string[];
  sessionCompletedAt?: string;
}

export interface DailyThroughputSummary {
  date: string;
  totalScheduled: number;
  completedCount: number;
  inProgressCount: number;
  upcomingCount: number;
  cancelledCount: number;
  targetPatients: number;
  completionRate: number;
  totalProduction: number;
}

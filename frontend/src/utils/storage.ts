import {
  Customer,
  Appointment,
  DailyThroughputSummary,
  DentalChair,
  StaffShift,
  ConsumableItem,
  TreatmentDetermination,
  AuthUser,
} from '../types';
import { evaluateMaintenanceDues, generateRecommendedServices } from './dentalRules';

const STORAGE_KEY = 'dental_suite_customers_v1';
const SELECTED_CUSTOMER_KEY = 'dental_suite_selected_customer_id';
const APPOINTMENTS_STORAGE_KEY = 'dental_suite_appointments_v1';
const CHAIRS_STORAGE_KEY = 'dental_suite_chairs_v1';
const SHIFTS_STORAGE_KEY = 'dental_suite_shifts_v1';
const CONSUMABLES_STORAGE_KEY = 'dental_suite_consumables_v1';
const DETERMINATIONS_STORAGE_KEY = 'dental_suite_determinations_v2';
const AUTH_USER_KEY = 'dental_suite_auth_user_v1';

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: Customer[] = JSON.parse(raw);
    return parsed.map((c) => ({
      ...c,
      cleaningDues: evaluateMaintenanceDues(c.cleaningDues || []),
      recommendedServices: generateRecommendedServices(c.teethChart, c.cleaningDues || [], c.id),
    }));
  } catch (err) {
    console.error('Failed to parse customers from localStorage', err);
    return [];
  }
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to save customers to localStorage', err);
  }
}

export function loadAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse appointments from localStorage', err);
    return [];
  }
}

export function saveAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  } catch (err) {
    console.error('Failed to save appointments to localStorage', err);
  }
}

// ---------------------------------------------------------------------------
// ADMIN & CLINIC MASTER DATA STORAGE
// ---------------------------------------------------------------------------

export function loadChairs(): DentalChair[] {
  try {
    const raw = localStorage.getItem(CHAIRS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse chairs from localStorage', err);
    return [];
  }
}

export function saveChairs(chairs: DentalChair[]): void {
  try {
    localStorage.setItem(CHAIRS_STORAGE_KEY, JSON.stringify(chairs));
  } catch (err) {
    console.error('Failed to save chairs to localStorage', err);
  }
}

export function loadShifts(): StaffShift[] {
  try {
    const raw = localStorage.getItem(SHIFTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse shifts from localStorage', err);
    return [];
  }
}

export function saveShifts(shifts: StaffShift[]): void {
  try {
    localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(shifts));
  } catch (err) {
    console.error('Failed to save shifts to localStorage', err);
  }
}

export function loadConsumables(): ConsumableItem[] {
  try {
    const raw = localStorage.getItem(CONSUMABLES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse consumables from localStorage', err);
    return [];
  }
}

export function saveConsumables(items: ConsumableItem[]): void {
  try {
    localStorage.setItem(CONSUMABLES_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save consumables to localStorage', err);
  }
}

export function loadDeterminations(): TreatmentDetermination[] {
  try {
    const raw = localStorage.getItem(DETERMINATIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse determinations from localStorage', err);
    return [];
  }
}

export function saveDeterminations(determinations: TreatmentDetermination[]): void {
  try {
    localStorage.setItem(DETERMINATIONS_STORAGE_KEY, JSON.stringify(determinations));
  } catch (err) {
    console.error('Failed to save determinations to localStorage', err);
  }
}

// ---------------------------------------------------------------------------
// AUTH USER SESSION STORAGE
// ---------------------------------------------------------------------------

export function loadCurrentUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      // Require login first initially before accessing clinic records
      return null;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse auth user', err);
    return null;
  }
}

export function saveCurrentUser(user: AuthUser | null): void {
  try {
    if (!user) {
      sessionStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    } else {
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to save auth user', err);
  }
}

export function calculateDailyThroughput(
  appointments: Appointment[],
  targetDate: string,
  dailyCapacityGoal: number = 8
): DailyThroughputSummary {
  const dayAppointments = appointments.filter((a) => a.date === targetDate);
  const completedCount = dayAppointments.filter((a) => a.status === 'completed').length;
  const inProgressCount = dayAppointments.filter((a) => a.status === 'in_progress').length;
  const upcomingCount = dayAppointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed'
  ).length;
  const cancelledCount = dayAppointments.filter(
    (a) => a.status === 'cancelled' || a.status === 'no_show'
  ).length;

  // Approximate production fee per procedure category in Philippine Peso (PHP ₱)
  const feeMapPhp: Record<string, number> = {
    Restorative: 3500,
    Preventive: 1800,
    Endodontic: 9500,
    Periodontic: 3200,
    'Oral Surgery': 8500,
    Cosmetic: 12000,
    Orthodontic: 3500,
    Consultation: 800,
  };

  const totalProduction = dayAppointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + (feeMapPhp[a.procedureCategory] || 2500), 0);

  const completionRate = Math.min(
    100,
    Math.round((completedCount / Math.max(1, dailyCapacityGoal)) * 100)
  );

  return {
    date: targetDate,
    totalScheduled: dayAppointments.length,
    completedCount,
    inProgressCount,
    upcomingCount,
    cancelledCount,
    targetPatients: dailyCapacityGoal,
    completionRate,
    totalProduction,
  };
}

export function getSelectedCustomerId(): string {
  const stored = localStorage.getItem(SELECTED_CUSTOMER_KEY);
  if (stored !== null) {
    return stored;
  }
  return '';
}

export function setSelectedCustomerId(id: string): void {
  localStorage.setItem(SELECTED_CUSTOMER_KEY, id);
}

export function resetToDefaults(): { customers: Customer[]; appointments: Appointment[] } {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SELECTED_CUSTOMER_KEY);
  localStorage.removeItem(APPOINTMENTS_STORAGE_KEY);
  localStorage.removeItem(CHAIRS_STORAGE_KEY);
  localStorage.removeItem(SHIFTS_STORAGE_KEY);
  localStorage.removeItem(CONSUMABLES_STORAGE_KEY);
  localStorage.removeItem(DETERMINATIONS_STORAGE_KEY);
  saveCustomers([]);
  saveAppointments([]);
  saveChairs([]);
  saveShifts([]);
  saveConsumables([]);
  saveDeterminations([]);
  return {
    customers: [],
    appointments: [],
  };
}


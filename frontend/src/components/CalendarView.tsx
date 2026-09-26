import React, { useState, useMemo } from 'react';
import {
  Appointment,
  Customer,
  DailyThroughputSummary,
  TreatmentLog,
  DentalPhoto,
  BeforeAfterPair,
  AppointmentReminderLog,
} from '../types';
import {
  DOCTOR_OPTIONS,
  OPERATORY_OPTIONS,
  PROCEDURE_CATEGORIES,
} from '../data/mockAppointments';
import { calculateDailyThroughput } from '../utils/storage';
import { AppointmentModal } from './AppointmentModal';
import { ReminderModal } from './ReminderModal';
import { SessionTreatmentModal } from './SessionTreatmentModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Bell,
  Camera,
  FileText,
  Filter,
  DollarSign,
  TrendingUp,
  XCircle,
  Activity,
  Layers,
  ArrowRight,
  Eye,
  Check,
} from 'lucide-react';

interface CalendarViewProps {
  appointments: Appointment[];
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  onSaveAppointment: (appointment: Appointment, isReschedule?: boolean) => void;
  onCancelAppointment: (apptId: string, reason: string) => void;
  onUpdateAppointmentStatus: (apptId: string, status: Appointment['status']) => void;
  onAddReminderLog: (apptId: string, log: AppointmentReminderLog) => void;
  onToggleAutomatedReminders: (apptId: string, enabled: boolean) => void;
  onCompleteClinicalSession: (data: {
    treatmentLog: TreatmentLog;
    newPhotos: DentalPhoto[];
    newBeforeAfterPair?: BeforeAfterPair;
    appointmentId: string;
    completedAt: string;
  }) => void;
  onNavigateToCustomer: (customerId: string) => void;
  onNavigateToPhotos: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onSaveAppointment,
  onCancelAppointment,
  onUpdateAppointmentStatus,
  onAddReminderLog,
  onToggleAutomatedReminders,
  onCompleteClinicalSession,
  onNavigateToCustomer,
  onNavigateToPhotos,
}) => {
  // Calendar View mode
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-03'); // Today
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterOperatory, setFilterOperatory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [appointmentModalMode, setAppointmentModalMode] = useState<
    'create' | 'edit' | 'reschedule' | 'cancel' | null
  >(null);
  const [activeAppointmentForModal, setActiveAppointmentForModal] = useState<Appointment | null>(
    null
  );
  const [reminderModalAppt, setReminderModalAppt] = useState<Appointment | null>(null);
  const [sessionModalAppt, setSessionModalAppt] = useState<Appointment | null>(null);

  // Collapsible / Expanding states for compact UI
  const [showThroughputDetails, setShowThroughputDetails] = useState<boolean>(false);
  const [expandedApptIds, setExpandedApptIds] = useState<Record<string, boolean>>({});
  const [showDailyOps, setShowDailyOps] = useState<boolean>(true);

  const toggleApptExpand = (apptId: string) => {
    setExpandedApptIds((prev) => ({ ...prev, [apptId]: !prev[apptId] }));
  };

  // Daily throughput metric
  const dailyThroughput: DailyThroughputSummary = useMemo(() => {
    return calculateDailyThroughput(appointments, selectedDate, 8);
  }, [appointments, selectedDate]);

  // Weekly throughput trend (7 days: Aug 31 to Sep 6, 2026)
  const weeklyThroughputData = useMemo(() => {
    const dates = [
      { date: '2026-08-31', dayLabel: 'Mon' },
      { date: '2026-09-01', dayLabel: 'Tue' },
      { date: '2026-09-02', dayLabel: 'Wed' },
      { date: '2026-09-03', dayLabel: 'Thu (Today)' },
      { date: '2026-09-04', dayLabel: 'Fri' },
      { date: '2026-09-05', dayLabel: 'Sat' },
      { date: '2026-09-06', dayLabel: 'Sun' },
    ];

    return dates.map((d) => {
      const summary = calculateDailyThroughput(appointments, d.date, 8);
      return {
        ...d,
        completedCount: summary.completedCount,
        totalScheduled: summary.totalScheduled,
        rate: summary.completionRate,
      };
    });
  }, [appointments]);

  // Filtered appointments for current date / view
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (viewMode === 'day' && a.date !== selectedDate) return false;
      if (filterDoctor !== 'all' && a.doctorName !== filterDoctor) return false;
      if (filterOperatory !== 'all' && a.operatory !== filterOperatory) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = a.customerName.toLowerCase().includes(query);
        const matchProc = a.procedureName.toLowerCase().includes(query);
        if (!matchName && !matchProc) return false;
      }
      return true;
    });
  }, [
    appointments,
    viewMode,
    selectedDate,
    filterDoctor,
    filterOperatory,
    filterStatus,
    searchQuery,
  ]);

  // Operations logged today across all appointments
  const operationsLoggedToday = useMemo(() => {
    return appointments.filter((a) => a.date === selectedDate && a.status === 'completed');
  }, [appointments, selectedDate]);

  // Date navigation handlers (safely calculated with local date components to avoid UTC offset shifts)
  const handlePrevDate = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    if (viewMode === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleNextDate = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    if (viewMode === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleSetToday = () => {
    setSelectedDate('2026-09-03');
  };

  // Open modal helpers
  const handleOpenBookModal = () => {
    setActiveAppointmentForModal(null);
    setAppointmentModalMode('create');
  };

  const handleOpenRescheduleModal = (appt: Appointment) => {
    setActiveAppointmentForModal(appt);
    setAppointmentModalMode('reschedule');
  };

  const handleOpenCancelModal = (appt: Appointment) => {
    setActiveAppointmentForModal(appt);
    setAppointmentModalMode('cancel');
  };

  const handleOpenSessionModal = (appt: Appointment) => {
    setSessionModalAppt(appt);
  };

  const handleOpenReminderModal = (appt: Appointment) => {
    setReminderModalAppt(appt);
  };

  // Customer for active session modal
  const customerForSession = useMemo(() => {
    if (!sessionModalAppt) return null;
    return (
      customers.find((c) => c.id === sessionModalAppt.customerId) || customers[0]
    );
  }, [sessionModalAppt, customers]);

  // Status badge styling helper
  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
            <Activity className="w-3 h-3" /> In Chair
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
            <Check className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3" /> Scheduled
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Banner: Patients Treated Per Day & Capacity Goal Dashboard (Compact with Expanding Div) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Appointments & Operatory Schedule
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Patients Treated Today: <strong className="text-emerald-700">{dailyThroughput.completedCount} / {dailyThroughput.targetPatients}</strong> ({dailyThroughput.completionRate}%) · In Chair: <strong className="text-amber-700">{dailyThroughput.inProgressCount}</strong> · Remaining: <strong className="text-sky-700">{dailyThroughput.upcomingCount}</strong> · Day Production: <strong className="text-slate-900">₱{dailyThroughput.totalProduction.toLocaleString('en-PH')}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setShowThroughputDetails(!showThroughputDetails)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{showThroughputDetails ? 'Fold Analytics' : 'Expand Analytics'}</span>
              {showThroughputDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenBookModal}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Expanding KPI Metrics Strip and 7-Day Trend Chart */}
        {showThroughputDetails && (
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Patients Treated Today Metric */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Patients Treated
                  </span>
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-black">
                    ✓
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-950">
                    {dailyThroughput.completedCount}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    / {dailyThroughput.targetPatients} Daily Target
                  </span>
                </div>
                <div className="mt-2 w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dailyThroughput.completionRate}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] font-semibold text-emerald-800 flex items-center justify-between">
                  <span>Goal: {dailyThroughput.completionRate}%</span>
                  <span>{dailyThroughput.completedCount >= 6 ? 'On Pace' : 'Active'}</span>
                </div>
              </div>

              {/* In Chair / In Progress Metric */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    In Chair / Active
                  </span>
                  <Activity className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-950">
                    {dailyThroughput.inProgressCount}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-700">Active</span>
                </div>
                <p className="mt-2 text-[10px] text-amber-700">
                  Operatory 2 executing adjustment
                </p>
              </div>

              {/* Upcoming Scheduled */}
              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                    Upcoming Today
                  </span>
                  <Clock className="w-4 h-4 text-sky-600" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-sky-950">
                    {dailyThroughput.upcomingCount}
                  </span>
                  <span className="text-[11px] font-semibold text-sky-700">Remaining</span>
                </div>
                <p className="mt-2 text-[10px] text-sky-700">
                  {dailyThroughput.totalScheduled} total booked for {selectedDate}
                </p>
              </div>

              {/* Total Day Production Value */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Daily Production
                  </span>
                  <DollarSign className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">
                    ₱{dailyThroughput.totalProduction.toLocaleString('en-PH')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">PHP</span>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  Completed clinical value logged
                </p>
              </div>
            </div>

            {/* 7-Day Throughput Trend Bar Chart */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                  <span>Weekly Patients Treated Trend</span>
                </span>
                <span className="text-[11px] text-slate-400">Click any day to view schedule</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weeklyThroughputData.map((day) => {
                  const isSelected = day.date === selectedDate;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedDate(day.date)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200 shadow-2xs'
                          : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-slate-500 truncate">
                        {day.dayLabel}
                      </div>
                      <div className="text-sm font-black text-slate-900 my-0.5">
                        {day.completedCount}
                        <span className="text-[10px] font-normal text-slate-400">/8</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${day.rate}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Controls & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Date Navigation */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrevDate}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSetToday}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              selectedDate === '2026-09-03'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Today (Sep 3)
          </button>

          <button
            type="button"
            onClick={handleNextDate}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
          />

          <span className="text-sm font-black text-slate-900 pl-2">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Search patient or procedure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white w-44 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />

          {/* Doctor Filter */}
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
          >
            <option value="all">All Providers</option>
            {DOCTOR_OPTIONS.map((doc) => (
              <option key={doc} value={doc}>
                {doc}
              </option>
            ))}
          </select>

          {/* Operatory Filter */}
          <select
            value={filterOperatory}
            onChange={(e) => setFilterOperatory(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
          >
            <option value="all">All Operatories</option>
            {OPERATORY_OPTIONS.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Chair</option>
            <option value="confirmed">Confirmed</option>
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Day / Week / Month View Switch */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-sky-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Calendar Content */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {/* Operatories Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OPERATORY_OPTIONS.map((operatory) => {
              const opAppointments = filteredAppointments.filter(
                (a) => a.operatory === operatory
              );

              return (
                <div
                  key={operatory}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden"
                >
                  {/* Operatory Header */}
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-800">{operatory}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {opAppointments.length} Patient{opAppointments.length === 1 ? '' : 's'} Scheduled
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                  </div>

                  {/* Appointment Cards List */}
                  <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px] bg-slate-50/40">
                    {opAppointments.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                        Chair available for booking
                      </div>
                    ) : (
                      opAppointments.map((appt) => {
                        const isExpanded = !!expandedApptIds[appt.id] || appt.status === 'in_progress';
                        return (
                          <div
                            key={appt.id}
                            className={`p-3 rounded-xl border bg-white shadow-2xs space-y-2 transition-all hover:border-slate-300 ${
                              appt.status === 'in_progress'
                                ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20'
                                : appt.status === 'completed'
                                ? 'border-emerald-200'
                                : 'border-slate-200'
                            }`}
                          >
                            {/* Compact Title / Event Header Row */}
                            <div
                              onClick={() => toggleApptExpand(appt.id)}
                              className="flex items-center justify-between text-xs cursor-pointer select-none gap-2"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono font-bold text-slate-900 shrink-0 text-xs">
                                  {appt.startTime}
                                </span>
                                <span className="font-bold text-slate-900 truncate text-xs">
                                  {appt.customerName}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {getStatusBadge(appt.status)}
                                <button
                                  type="button"
                                  className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                  title={isExpanded ? 'Fold details' : 'Expand details'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleApptExpand(appt.id);
                                  }}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Compact Subtitle (Procedure Title) */}
                            <div className="text-[11px] text-slate-600 font-medium truncate flex items-center justify-between">
                              <span className="truncate">{appt.procedureName}</span>
                              <span className="text-[10px] text-slate-400 shrink-0 ml-1.5 font-normal">
                                {appt.durationMinutes}m
                              </span>
                            </div>

                            {/* Expanding Div: Full Clinical Details and Actions (Can be folded back) */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs animate-in fade-in duration-100">
                                <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                                  <span>{appt.customerPhone}</span>
                                  <span>Dr. {appt.doctorName.split(',')[0]}</span>
                                </div>

                                {appt.relatedTeeth && appt.relatedTeeth.length > 0 && (
                                  <div className="text-[10px] text-sky-700 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                    Teeth: #{appt.relatedTeeth.join(', #')}
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-1.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 text-xs">
                                  {/* Reminder Trigger Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReminderModal(appt)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1 cursor-pointer"
                                    title="Send automated SMS / Email reminder"
                                  >
                                    <Bell className="w-3 h-3 text-sky-600" />
                                    <span>
                                      Reminder ({appt.reminderLogs ? appt.reminderLogs.length : 0})
                                    </span>
                                  </button>

                                  {/* Log Clinical Session & Photo Ops Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSessionModal(appt)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                      appt.status === 'completed'
                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                        : 'bg-sky-600 text-white hover:bg-sky-700 shadow-xs'
                                    }`}
                                  >
                                    <Camera className="w-3 h-3" />
                                    <span>
                                      {appt.status === 'completed' ? 'Session Logged' : 'Log Treatment'}
                                    </span>
                                  </button>

                                  {/* Reschedule & Cancel buttons */}
                                  {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                                    <div className="flex items-center gap-1 ml-auto">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRescheduleModal(appt)}
                                        className="text-[10px] text-slate-500 hover:text-slate-800 px-1 py-0.5 cursor-pointer"
                                        title="Reschedule"
                                      >
                                        Reschedule
                                      </button>
                                      <span className="text-slate-300">|</span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenCancelModal(appt)}
                                        className="text-[10px] text-rose-500 hover:text-rose-700 px-1 py-0.5 cursor-pointer"
                                        title="Cancel"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily Clinical Operations Log (Logged for this calendar day) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Clinical Operations Logged for {selectedDate} ({operationsLoggedToday.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {operationsLoggedToday.length} Treated
                </span>
                <button
                  type="button"
                  onClick={() => setShowDailyOps(!showDailyOps)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                  title={showDailyOps ? 'Fold operations' : 'Expand operations'}
                >
                  {showDailyOps ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {showDailyOps && (
              <>
                {operationsLoggedToday.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                    No clinical operations logged for this day yet. Click "Log Treatment" on any appointment above to record.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {operationsLoggedToday.map((op) => (
                      <div
                        key={`op-${op.id}`}
                        className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 flex space-x-2.5 items-start text-xs"
                      >
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          ✓
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-bold text-xs text-slate-900 truncate">
                              {op.customerName}
                            </div>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {op.startTime}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-700 mt-0.5">
                            {op.procedureName}
                          </div>
                          {op.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 italic">
                              "{op.notes}"
                            </div>
                          )}
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Dr. {op.doctorName.split(',')[0]}</span>
                            {op.sessionPhotosCount ? (
                              <button
                                type="button"
                                onClick={onNavigateToPhotos}
                                className="text-sky-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                <Camera className="w-3 h-3" />
                                <span>{op.sessionPhotosCount} Photos</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">
              Weekly Overview: Aug 31 - Sep 6, 2026
            </h3>
            <span className="text-xs text-slate-500">
              {filteredAppointments.length} Appointments scheduled across week
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {weeklyThroughputData.map((d) => {
              const dayAppts = appointments.filter((a) => a.date === d.date);
              const isToday = d.date === '2026-09-03';

              return (
                <div
                  key={d.date}
                  className={`rounded-xl border flex flex-col min-h-[360px] p-2.5 ${
                    isToday ? 'bg-sky-50/40 border-sky-300' : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="pb-2 border-b border-slate-200/60 mb-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{d.dayLabel}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.date.slice(5)}</div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-emerald-700 border border-slate-200">
                      {d.completedCount} Treated
                    </span>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayAppts.map((appt) => (
                      <div
                        key={appt.id}
                        onClick={() => {
                          setSelectedDate(appt.date);
                          setViewMode('day');
                        }}
                        className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs text-left cursor-pointer hover:border-sky-400 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-slate-800">
                            {appt.startTime}
                          </span>
                          {getStatusBadge(appt.status)}
                        </div>
                        <div className="font-bold text-xs text-slate-900 truncate mt-1">
                          {appt.customerName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {appt.procedureName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">
              September 2026 Monthly Clinical Calendar
            </h3>
            <span className="text-xs text-slate-500">
              Click any calendar day to inspect staff schedule
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase py-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, idx) => {
              const dayNum = idx - 1; // September 2026 starts on Tuesday (Sep 1)
              const isValid = dayNum >= 1 && dayNum <= 30;
              const dateStr = `2026-09-${String(dayNum).padStart(2, '0')}`;
              const dayAppts = appointments.filter((a) => a.date === dateStr);
              const treatedCount = dayAppts.filter((a) => a.status === 'completed').length;
              const isToday = dateStr === '2026-09-03';
              const isSelected = dateStr === selectedDate;

              if (!isValid) {
                return (
                  <div
                    key={idx}
                    className="h-24 p-2 bg-slate-50/40 rounded-xl border border-dashed border-slate-200 opacity-40"
                  />
                );
              }

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setViewMode('day');
                  }}
                  className={`h-24 p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200'
                      : isToday
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-sky-600 text-white' : 'text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {treatedCount > 0 && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">
                        {treatedCount} Trtd
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="text-[9px] truncate px-1 py-0.5 rounded bg-slate-100 text-slate-700"
                      >
                        {a.startTime} {a.customerName.split(' ')[0]}
                      </div>
                    ))}
                    {dayAppts.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-semibold px-1">
                        +{dayAppts.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment Booking / Reschedule / Cancel Modal */}
      {appointmentModalMode && (
        <AppointmentModal
          mode={appointmentModalMode}
          appointment={activeAppointmentForModal || undefined}
          customers={customers}
          defaultDate={selectedDate}
          defaultCustomerId={selectedCustomerId}
          onClose={() => setAppointmentModalMode(null)}
          onSave={(appt, isResched) => {
            onSaveAppointment(appt, isResched);
            setAppointmentModalMode(null);
          }}
          onCancelAppointment={(id, reason) => {
            onCancelAppointment(id, reason);
            setAppointmentModalMode(null);
          }}
        />
      )}

      {/* Automated Reminder Modal */}
      {reminderModalAppt && (
        <ReminderModal
          appointment={reminderModalAppt}
          onClose={() => setReminderModalAppt(null)}
          onSendReminder={(log) => {
            onAddReminderLog(reminderModalAppt.id, log);
          }}
          onToggleAutomated={(enabled) => {
            onToggleAutomatedReminders(reminderModalAppt.id, enabled);
          }}
        />
      )}

      {/* Session Treatment & Photo Ops Logger Modal */}
      {sessionModalAppt && customerForSession && (
        <SessionTreatmentModal
          appointment={sessionModalAppt}
          customer={customerForSession}
          onClose={() => setSessionModalAppt(null)}
          onSaveSession={(data) => {
            onCompleteClinicalSession(data);
            setSessionModalAppt(null);
          }}
        />
      )}
    </div>
  );
};

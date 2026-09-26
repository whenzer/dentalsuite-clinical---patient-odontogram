import React, { useState } from 'react';
import { Appointment, Customer, ToothNumber } from '../types';
import {
  DOCTOR_OPTIONS,
  OPERATORY_OPTIONS,
  PROCEDURE_CATEGORIES,
} from '../data/mockAppointments';
import {
  X,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Stethoscope,
} from 'lucide-react';

interface AppointmentModalProps {
  mode: 'create' | 'edit' | 'reschedule' | 'cancel';
  appointment?: Appointment;
  customers: Customer[];
  defaultDate?: string;
  defaultCustomerId?: string;
  onClose: () => void;
  onSave: (appt: Appointment, isReschedule?: boolean) => void;
  onCancelAppointment?: (apptId: string, reason: string) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  mode,
  appointment,
  customers,
  defaultDate = new Date().toISOString().split('T')[0],
  defaultCustomerId,
  onClose,
  onSave,
  onCancelAppointment,
}) => {
  // Common state
  const [customerId, setCustomerId] = useState<string>(
    appointment?.customerId || defaultCustomerId || customers[0]?.id || ''
  );
  const [date, setDate] = useState<string>(appointment?.date || defaultDate);
  const [startTime, setStartTime] = useState<string>(appointment?.startTime || '09:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(
    appointment?.durationMinutes || 45
  );
  const [doctorName, setDoctorName] = useState<string>(
    appointment?.doctorName || DOCTOR_OPTIONS[0]
  );
  const [operatory, setOperatory] = useState<string>(
    appointment?.operatory || OPERATORY_OPTIONS[0]
  );
  const [procedureCategory, setProcedureCategory] = useState<Appointment['procedureCategory']>(
    appointment?.procedureCategory || 'Preventive'
  );
  const [procedureName, setProcedureName] = useState<string>(
    appointment?.procedureName || 'Adult Prophylaxis & Examination'
  );
  const [selectedTeeth, setSelectedTeeth] = useState<ToothNumber[]>(
    appointment?.relatedTeeth || []
  );
  const [notes, setNotes] = useState<string>(appointment?.notes || '');
  const [reminderPreference, setReminderPreference] = useState<Appointment['reminderPreference']>(
    appointment?.reminderPreference || 'both'
  );
  const [automatedRemindersEnabled, setAutomatedRemindersEnabled] = useState<boolean>(
    appointment?.automatedRemindersEnabled ?? true
  );

  // Cancellation state
  const [cancelReason, setCancelReason] = useState<string>('Patient requested schedule change');

  // Compute end time based on start time and duration
  const calculateEndTime = (start: string, duration: number): string => {
    const [h, m] = start.split(':').map(Number);
    const totalMinutes = h * 60 + m + duration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const currentPatient = customers.find((c) => c.id === customerId);

  // Quick procedure recommendations
  const commonProcedures = [
    { cat: 'Preventive', name: 'Adult Prophylaxis & Examination', dur: 45 },
    { cat: 'Preventive', name: 'Fluoride & Periodontal Charting', dur: 30 },
    { cat: 'Restorative', name: 'Composite Filling (1-2 Surfaces)', dur: 60 },
    { cat: 'Restorative', name: 'Crown Preparation & Digital Scan', dur: 60 },
    { cat: 'Endodontic', name: 'Root Canal Therapy Stage 1', dur: 90 },
    { cat: 'Oral Surgery', name: 'Wisdom Tooth Extraction', dur: 60 },
    { cat: 'Cosmetic', name: 'In-Office Teeth Whitening', dur: 60 },
    { cat: 'Consultation', name: 'Emergency Toothache Assessment', dur: 30 },
  ];

  const handleApplyProcedure = (item: (typeof commonProcedures)[0]) => {
    setProcedureCategory(item.cat as any);
    setProcedureName(item.name);
    setDurationMinutes(item.dur);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    const endTime = calculateEndTime(startTime, durationMinutes);

    if (mode === 'reschedule' && appointment) {
      const updated: Appointment = {
        ...appointment,
        date,
        startTime,
        durationMinutes,
        endTime,
        doctorName,
        operatory,
        notes: notes ? `${notes} (Rescheduled on ${new Date().toLocaleDateString()})` : notes,
        rescheduledFrom: {
          date: appointment.date,
          startTime: appointment.startTime,
        },
        status: 'confirmed',
        reminderLogs: [
          ...(appointment.reminderLogs || []),
          {
            id: `rem-resched-${Date.now()}`,
            type: reminderPreference === 'email' ? 'email' : 'sms',
            recipient:
              reminderPreference === 'email'
                ? currentPatient.email
                : currentPatient.phone,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            trigger: 'reschedule_notice',
            message: `DentalSuite Notice: Appointment rescheduled to ${date} at ${startTime} with ${doctorName}.`,
            status: 'delivered',
          },
        ],
      };
      onSave(updated, true);
    } else if (mode === 'create') {
      const newAppt: Appointment = {
        id: '',
        customerId,
        customerName: `${currentPatient.firstName} ${currentPatient.lastName}`,
        customerPhone: currentPatient.phone,
        customerEmail: currentPatient.email,
        date,
        startTime,
        durationMinutes,
        endTime,
        doctorName,
        operatory,
        procedureCategory,
        procedureName,
        relatedTeeth: selectedTeeth.length > 0 ? selectedTeeth : undefined,
        status: 'confirmed',
        notes,
        reminderPreference,
        automatedRemindersEnabled,
        reminderLogs: [
          {
            id: `rem-init-${Date.now()}`,
            type: reminderPreference === 'email' ? 'email' : 'sms',
            recipient:
              reminderPreference === 'email' ? currentPatient.email : currentPatient.phone,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            trigger: 'booking_confirmation',
            message: `Booking Confirmed: ${currentPatient.firstName}, your visit is booked for ${date} at ${startTime} with ${doctorName}.`,
            status: 'delivered',
          },
        ],
      };
      onSave(newAppt);
    } else if (mode === 'edit' && appointment) {
      const updated: Appointment = {
        ...appointment,
        customerId,
        customerName: `${currentPatient.firstName} ${currentPatient.lastName}`,
        customerPhone: currentPatient.phone,
        customerEmail: currentPatient.email,
        date,
        startTime,
        durationMinutes,
        endTime,
        doctorName,
        operatory,
        procedureCategory,
        procedureName,
        relatedTeeth: selectedTeeth,
        notes,
        reminderPreference,
        automatedRemindersEnabled,
      };
      onSave(updated);
    }
  };

  // If cancellation mode
  if (mode === 'cancel' && appointment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 border-b border-slate-200 bg-rose-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-rose-950 text-base">Cancel Appointment</h3>
                <p className="text-xs text-rose-600 mt-0.5">
                  Confirm cancellation and record clinic reason
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 text-sm">{appointment.customerName}</div>
              <div>
                {appointment.date} @ {appointment.startTime} - {appointment.endTime}
              </div>
              <div className="text-slate-500">
                {appointment.procedureName} • {appointment.doctorName}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cancellation Reason
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Patient requested schedule change">
                  Patient requested schedule change
                </option>
                <option value="Patient illness or medical conflict">
                  Patient illness or medical conflict
                </option>
                <option value="Scheduling conflict with provider">
                  Scheduling conflict with provider
                </option>
                <option value="Insurance or financial hold">Insurance or financial hold</option>
                <option value="Patient no-show">Patient no-show</option>
              </select>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
              Automated SMS/Email notification will inform the patient and suggest rescheduling options.
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Keep Appointment
            </button>
            <button
              type="button"
              onClick={() => onCancelAppointment && onCancelAppointment(appointment.id, cancelReason)}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                mode === 'reschedule'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-sky-100 text-sky-700 border-sky-200'
              }`}
            >
              {mode === 'reschedule' ? <RotateCcw className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {mode === 'reschedule'
                  ? 'Reschedule Appointment'
                  : mode === 'edit'
                  ? 'Edit Appointment Details'
                  : 'Book Patient Appointment'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'reschedule'
                  ? `Currently set for ${appointment?.date} @ ${appointment?.startTime}. Choose new slot.`
                  : 'Schedule chair time, assign clinical provider, and automate reminders.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Patient
            </label>
            <select
              disabled={mode === 'reschedule'}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 cursor-pointer"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} — Phone: {c.phone} (DOB: {c.dob})
                </option>
              ))}
            </select>
            {currentPatient && (
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span>Email: {currentPatient.email}</span>
                <span>•</span>
                <span>Insurance: {currentPatient.insuranceProvider || 'Standard Self-Pay'}</span>
              </div>
            )}
          </div>

          {/* Quick Procedure Presets (for create mode) */}
          {mode === 'create' && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                <span>Common Procedure Presets</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {commonProcedures.map((proc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyProcedure(proc)}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 rounded-lg text-slate-600 transition-colors"
                  >
                    {proc.name} ({proc.dur}m)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Time Slot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Appointment Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Time
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {[
                  '08:00',
                  '08:30',
                  '09:00',
                  '09:30',
                  '10:00',
                  '10:30',
                  '11:00',
                  '11:30',
                  '12:00',
                  '13:00',
                  '13:30',
                  '14:00',
                  '14:30',
                  '15:00',
                  '15:30',
                  '16:00',
                  '16:30',
                  '17:00',
                ].map((t) => (
                  <option key={t} value={t}>
                    {t} ({Number(t.split(':')[0]) > 12 ? `${Number(t.split(':')[0]) - 12}:${t.split(':')[1]} PM` : `${t} AM`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value={15}>15 min (Brief Check / Suture)</option>
                <option value={30}>30 min (Exam / Fast consult)</option>
                <option value={45}>45 min (Standard Hygiene)</option>
                <option value={60}>60 min (Restorative / Crown)</option>
                <option value={90}>90 min (Endo / Surgical)</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-sky-700 bg-sky-50 p-2.5 rounded-lg border border-sky-100 flex items-center justify-between">
            <span>
              Calculated Slot: <strong>{startTime}</strong> to{' '}
              <strong>{calculateEndTime(startTime, durationMinutes)}</strong>
            </span>
            <span className="text-[11px] font-semibold">{durationMinutes} Minutes Reserved</span>
          </div>

          {/* Provider & Operatory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Provider
              </label>
              <select
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {DOCTOR_OPTIONS.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Operatory / Chair
              </label>
              <select
                value={operatory}
                onChange={(e) => setOperatory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {OPERATORY_OPTIONS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Procedure Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Procedure Description
              </label>
              <input
                type="text"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                required
                placeholder="e.g. Molar Composite Restoration"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={procedureCategory}
                onChange={(e) => setProcedureCategory(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {PROCEDURE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clinical Notes / Patient Preferences */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Appointment Notes & Patient Requests
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Premedicate with amoxicillin 2g. Patient has dental anxiety."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Automated Reminders Preferences */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Automated Patient Reminders
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Send automated SMS text alerts & email confirmation notices
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={automatedRemindersEnabled}
                  onChange={(e) => setAutomatedRemindersEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            {automatedRemindersEnabled && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200 text-xs">
                <span className="font-semibold text-slate-600">Reminder Channel:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="reminderPref"
                    value="both"
                    checked={reminderPreference === 'both'}
                    onChange={() => setReminderPreference('both')}
                    className="text-sky-600"
                  />
                  <span>Both SMS & Email</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="reminderPref"
                    value="sms"
                    checked={reminderPreference === 'sms'}
                    onChange={() => setReminderPreference('sms')}
                    className="text-sky-600"
                  />
                  <span>SMS Only</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="reminderPref"
                    value="email"
                    checked={reminderPreference === 'email'}
                    onChange={() => setReminderPreference('email')}
                    className="text-sky-600"
                  />
                  <span>Email Only</span>
                </label>
              </div>
            )}
          </div>

          {/* Modal Buttons */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {mode === 'reschedule'
                  ? 'Confirm Reschedule'
                  : mode === 'edit'
                  ? 'Update Appointment'
                  : 'Save & Confirm Booking'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

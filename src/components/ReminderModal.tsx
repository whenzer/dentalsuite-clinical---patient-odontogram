import React, { useState } from 'react';
import { Appointment, AppointmentReminderLog } from '../types';
import {
  X,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Smartphone,
  Calendar,
  User,
  ShieldCheck,
  Bell,
} from 'lucide-react';

interface ReminderModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSendReminder: (reminder: AppointmentReminderLog) => void;
  onToggleAutomated: (enabled: boolean) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  appointment,
  onClose,
  onSendReminder,
  onToggleAutomated,
}) => {
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [triggerType, setTriggerType] = useState<AppointmentReminderLog['trigger']>('automated_24h');
  const [customNote, setCustomNote] = useState(
    'Please arrive 10 minutes early. Remember to bring your insurance card and dental nightguard if applicable.'
  );
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);

  const defaultSmsText = `DentalSuite Pro Alert: Hi ${appointment.customerName}, your dental appointment with ${appointment.doctorName} is on ${appointment.date} at ${appointment.startTime} (${appointment.operatory}). Procedure: ${appointment.procedureName}. ${customNote} Reply C to confirm or call 555-0199.`;

  const defaultEmailSubject = `Appointment Reminder: ${appointment.customerName} on ${appointment.date} at ${appointment.startTime}`;

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      const newLog: AppointmentReminderLog = {
        id: `rem-gen-${Date.now()}`,
        type: channel,
        recipient: channel === 'sms' ? appointment.customerPhone : appointment.customerEmail,
        timestamp: timeStr,
        trigger: triggerType,
        message: channel === 'sms' ? defaultSmsText : `${defaultEmailSubject}\n${customNote}`,
        status: 'delivered',
      };

      onSendReminder(newLog);
      setIsSending(false);
      setSentSuccess(
        `Dispatched successfully via ${channel.toUpperCase()} to ${
          channel === 'sms' ? appointment.customerPhone : appointment.customerEmail
        }!`
      );
      setTimeout(() => setSentSuccess(null), 3500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Patient Reminder Dispatch</h3>
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">
                  Automated Queue
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatch automated SMS text alerts or formatted clinical emails to patient.
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Patient & Appointment Context Strip */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-900">{appointment.customerName}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{appointment.customerPhone}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{appointment.customerEmail}</span>
            </div>
            <div className="flex items-center space-x-2 text-sky-700 font-semibold">
              <Calendar className="w-4 h-4" />
              <span>
                {appointment.date} @ {appointment.startTime}
              </span>
            </div>
          </div>

          {/* Automated Reminders Switch */}
          <div className="flex items-center justify-between p-3.5 bg-sky-50/60 rounded-xl border border-sky-200/70">
            <div>
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                Automated System Schedule
              </span>
              <p className="text-[11px] text-sky-700/80 mt-0.5">
                Automatically trigger 48h email confirmation, 24h SMS alert, and 2h day-of reminder.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appointment.automatedRemindersEnabled}
                onChange={(e) => onToggleAutomated(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {/* Channel Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Dispatch Channel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  channel === 'sms'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>SMS Mobile Text Message</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  channel === 'email'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Clinical Email Notification</span>
              </button>
            </div>
          </div>

          {/* Trigger Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Notification Trigger
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'automated_24h', label: '24-Hour Notice' },
                { id: 'automated_2h', label: '2-Hour Urgent Alert' },
                { id: 'automated_48h', label: '48-Hour Pre-Confirmation' },
                { id: 'manual_staff', label: 'Staff Custom Message' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTriggerType(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    triggerType === t.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Special Instructions / Note for Patient
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Please take prescribed premedication 1 hour prior..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>

          {/* Live Preview of Message */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Live Preview ({channel.toUpperCase()})
            </label>

            {channel === 'sms' ? (
              <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-inner max-w-lg mx-auto">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2 mb-3">
                  <span>DentalSuite SMS Gateway • 555-0199</span>
                  <span>Recipient: {appointment.customerPhone}</span>
                </div>
                <div className="bg-sky-600 text-white p-3.5 rounded-2xl rounded-tr-xs text-xs leading-relaxed shadow-sm">
                  {defaultSmsText}
                </div>
                <div className="text-[10px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1">
                  <span>Standard SMS Gateway</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-xs space-y-3">
                <div className="border-b border-slate-100 pb-2 flex items-center justify-between text-slate-500 text-[11px]">
                  <span>To: {appointment.customerEmail}</span>
                  <span>From: reminders@dentalsuitepro.clinic</span>
                </div>
                <div className="font-bold text-slate-800 text-sm">{defaultEmailSubject}</div>
                <div className="p-3 bg-sky-50 rounded-lg border border-sky-100 space-y-1">
                  <div className="font-semibold text-sky-900">
                    Appointment with {appointment.doctorName}
                  </div>
                  <div className="text-sky-700">
                    Date & Time: {appointment.date} at {appointment.startTime} - {appointment.endTime}
                  </div>
                  <div className="text-sky-700">Operatory: {appointment.operatory}</div>
                  <div className="text-sky-700 font-medium">Procedure: {appointment.procedureName}</div>
                </div>
                <p className="text-slate-600 text-xs italic">{customNote}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>DentalSuite Clinical Pro • 100 Health Way, Suite 400</span>
                  <span className="text-sky-600 font-semibold">One-Click Add to Calendar</span>
                </div>
              </div>
            )}
          </div>

          {/* Success Alert Banner */}
          {sentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sentSuccess}</span>
            </div>
          )}

          {/* Previous Reminder History Log */}
          {appointment.reminderLogs && appointment.reminderLogs.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Dispatched History ({appointment.reminderLogs.length})
              </label>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {appointment.reminderLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start space-x-2">
                      {log.type === 'sms' ? (
                        <Smartphone className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="uppercase text-[10px] font-bold text-slate-500">
                            {log.type}
                          </span>
                          <span className="text-[10px] text-slate-400">• {log.timestamp}</span>
                          <span className="text-[10px] font-mono text-slate-500">({log.trigger})</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                          {log.message}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Delivered
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Reminders queue synced in real time</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={handleSend}
              className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending Dispatch...' : 'Send Reminder Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

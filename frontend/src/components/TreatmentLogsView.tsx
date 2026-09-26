import React, { useState, useMemo } from 'react';
import { Customer, MaintenanceDue, TreatmentLog, ToothNumber } from '../types';
import {
  formatPHP,
  getTreatmentUrgency,
  sortTreatmentsByUrgency,
  URGENCY_TIERS,
} from '../utils/urgencyRules';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Stethoscope,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TreatmentLogsViewProps {
  customer: Customer;
  onAddTreatmentLog: (log: TreatmentLog) => void;
  onUpdateCleaningDues: (dues: MaintenanceDue[]) => void;
}

export const TreatmentLogsView: React.FC<TreatmentLogsViewProps> = ({
  customer,
  onAddTreatmentLog,
  onUpdateCleaningDues,
}) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDuesDetails, setShowDuesDetails] = useState(false);
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  const toggleLogExpand = (id: string) => {
    setExpandedLogIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [procedureName, setProcedureName] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Emily Watson, DDS');
  const [category, setCategory] = useState<TreatmentLog['category']>('Restorative');
  const [teethInput, setTeethInput] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [cost, setCost] = useState(2800);
  const [status, setStatus] = useState<TreatmentLog['status']>('Completed');

  // Quick Action: Log Cleaning Completed Today
  const handlePerformCleaningToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 6);
    const nextDueDateStr = nextDate.toISOString().split('T')[0];

    const updatedDues: MaintenanceDue[] = (customer.cleaningDues || []).map((due) => {
      if (due.type.includes('Cleaning') || due.type.includes('Prophylaxis')) {
        return {
          ...due,
          lastDoneDate: today,
          nextDueDate: nextDueDateStr,
          status: 'up_to_date',
          notes: 'Routine scaling & polishing performed.',
        };
      }
      return due;
    });

    onUpdateCleaningDues(updatedDues);

    const newLog: TreatmentLog = {
      id: `log-clean-${Date.now()}`,
      customerId: customer.id,
      date: today,
      doctorName: 'Dental Hygienist Sarah Miller, RDH / Dr. Emily Watson',
      procedureName: 'Adult Dental Prophylaxis & Scaling (Full Mouth)',
      category: 'Preventive',
      teethInvolved: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32] as ToothNumber[],
      clinicalNotes: 'Supragingival & subgingival plaque debridement. Fluoride varnish 5% applied.',
      cost: 1800,
      status: 'Completed',
    };

    onAddTreatmentLog(newLog);
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procedureName.trim()) return;

    let parsedTeeth: ToothNumber[] = [];
    if (teethInput.trim()) {
      parsedTeeth = teethInput
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 32) as ToothNumber[];
    }

    const newLog: TreatmentLog = {
      id: `log-${Date.now()}`,
      customerId: customer.id,
      date: new Date().toISOString().split('T')[0],
      doctorName: doctorName.trim() || 'Attending Dentist',
      procedureName: procedureName.trim(),
      category,
      teethInvolved: parsedTeeth,
      clinicalNotes: clinicalNotes.trim() || 'Procedure executed successfully without adverse events.',
      cost: Number(cost) || 0,
      status,
    };

    onAddTreatmentLog(newLog);
    setShowLogModal(false);
    setProcedureName('');
    setTeethInput('');
    setClinicalNotes('');
    setCost(250);
  };

  const dues = customer.cleaningDues || [];
  const logs = customer.treatmentLogs || [];
  const sortedLogs = useMemo(() => {
    return sortTreatmentsByUrgency(logs);
  }, [logs]);

  return (
    <div className="space-y-4">
      {/* Cleaning and Maintenance Dues Panel (Compact with Expanding Div) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">
                Hygiene & Cleaning Dues
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Prophylaxis cycles and recall tracking for {customer.firstName} {customer.lastName}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDuesDetails(!showDuesDetails)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{showDuesDetails ? 'Fold Recall Dues' : 'Expand Recall Dues'}</span>
              {showDuesDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              id="log-cleaning-today-btn"
              onClick={handlePerformCleaningToday}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Log Cleaning Today (+6 Mo)</span>
            </button>
          </div>
        </div>

        {/* Expanding Dues Cards */}
        {showDuesDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 animate-in fade-in duration-100">
            {dues.map((due, index) => {
              const isOverdue = due.status === 'overdue';
              const isDueSoon = due.status === 'due_soon';

              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isOverdue
                      ? 'bg-rose-50/60 border-rose-200'
                      : isDueSoon
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{due.type}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : isDueSoon
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {due.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Next Due: <strong className={isOverdue ? 'text-rose-700' : 'text-slate-800'}>{due.nextDueDate}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Last: {due.lastDoneDate} ({due.intervalMonths} mo interval)
                    </p>
                    {due.notes && (
                      <p className="text-[11px] text-slate-600 italic mt-1.5 bg-white/80 p-1.5 rounded border border-slate-100">
                        {due.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clinical Treatment Logs Section (Compact with Expanding Divs) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">
                Clinical Treatment Ledger ({logs.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical procedures, restorative treatments, and clinical session notes.
            </p>
          </div>

          <button
            type="button"
            id="add-treatment-log-btn"
            onClick={() => setShowLogModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Treatment Log</span>
          </button>
        </div>

        {/* Treatment Log Table / Cards (Sorted by Urgency) */}
        {logs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
            <Stethoscope className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
            <p className="font-semibold text-xs text-slate-700">No treatment logs on file</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Record a clinical treatment or procedure above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedLogs.map((log) => {
              const urg = log.urgencyGroup
                ? URGENCY_TIERS[log.urgencyGroup]
                : getTreatmentUrgency(log.procedureName);
              const isExpanded = !!expandedLogIds[log.id];
              return (
                <div
                  key={log.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    urg.rank === 1
                      ? 'border-rose-300 bg-rose-50/15'
                      : urg.rank === 2
                      ? 'border-amber-200 bg-amber-50/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Compact Header Row */}
                  <div
                    onClick={() => toggleLogExpand(log.id)}
                    className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-900 shrink-0">
                        {log.date}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${urg.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${urg.dotClass}`} />
                        {urg.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 shrink-0">
                        {log.category}
                      </span>
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {log.procedureName}
                      </span>
                      {log.teethInvolved && log.teethInvolved.length > 0 && (
                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800 shrink-0">
                          #{log.teethInvolved.join(', #')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {formatPHP(log.cost)} PHP
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {log.status}
                      </span>
                      <button
                        type="button"
                        className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                        title={isExpanded ? 'Fold details' : 'Expand details'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanding Div: Full Clinical Notes & Clinician */}
                  {isExpanded && (
                    <div className="p-3.5 bg-white border-t border-slate-100 text-xs space-y-2 animate-in fade-in duration-100">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Clinical Notes
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          {log.clinicalNotes}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>
                          Attending Clinician: <strong className="text-slate-800">{log.doctorName}</strong>
                        </span>
                        {log.teethInvolved && log.teethInvolved.length > 0 && (
                          <span>Teeth Treated: #{log.teethInvolved.join(', #')}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Treatment Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-xl border border-slate-200 space-y-3.5">
            <h3 className="font-bold text-slate-900 text-base">
              Add Clinical Treatment Log
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Procedure Name *
              </label>
              <input
                type="text"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                placeholder="e.g., Composite Restoration 2-Surfaces (DO)"
                className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 focus:outline-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white"
                >
                  <option value="Preventive">Preventive</option>
                  <option value="Restorative">Restorative</option>
                  <option value="Endodontic">Endodontic</option>
                  <option value="Periodontic">Periodontic</option>
                  <option value="Prosthodontic">Prosthodontic</option>
                  <option value="Orthodontic">Orthodontic</option>
                  <option value="Oral Surgery">Oral Surgery</option>
                  <option value="Cosmetic">Cosmetic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teeth Numbers (comma separated)
                </label>
                <input
                  type="text"
                  value={teethInput}
                  onChange={(e) => setTeethInput(e.target.value)}
                  placeholder="e.g., 3, 14"
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billed Fee (PHP ₱)
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planned">Planned</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attending Clinician
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Session Notes & Findings
              </label>
              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Details of materials, isolation, anesthesia, cavity depth..."
                className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 focus:outline-sky-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="submit-new-treatment-log-btn"
                onClick={handleCreateLog}
                disabled={!procedureName.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                Save Treatment Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Customer, RecommendedService, ToothNumber } from '../types';
import { generateRecommendedServices } from '../utils/dentalRules';
import {
  formatPHP,
  getTreatmentUrgency,
  sortTreatmentsByUrgency,
  URGENCY_TIERS,
} from '../utils/urgencyRules';
import {
  Lightbulb,
  ShieldAlert,
  Clock,
  CalendarCheck,
  CheckCircle2,
  Plus,
  Printer,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RecommendedServicesViewProps {
  customer: Customer;
  onUpdateRecommendations: (recs: RecommendedService[]) => void;
  onScheduleNextVisit?: (serviceIds: string[]) => void;
}

export const RecommendedServicesView: React.FC<RecommendedServicesViewProps> = ({
  customer,
  onUpdateRecommendations,
  onScheduleNextVisit,
}) => {
  const recommendations = customer.recommendedServices || [];
  const sortedRecommendations = useMemo(() => {
    return sortTreatmentsByUrgency(recommendations);
  }, [recommendations]);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [expandedRecIds, setExpandedRecIds] = useState<Record<string, boolean>>({});
  const [showHeroPlan, setShowHeroPlan] = useState(true);

  const toggleRecExpand = (id: string) => {
    setExpandedRecIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [customTitle, setCustomTitle] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [customPriority, setCustomPriority] = useState<RecommendedService['priority']>('routine');
  const [customCategory, setCustomCategory] = useState('Restorative');
  const [customFee, setCustomFee] = useState(2500);
  const [customTeeth, setCustomTeeth] = useState('');
  const [customPreemptive, setCustomPreemptive] = useState(false);

  // Toggle selection for scheduled appointment
  const handleToggleSchedule = (id: string) => {
    const updated = recommendations.map((r) =>
      r.id === id ? { ...r, addedToSchedule: !r.addedToSchedule } : r
    );
    onUpdateRecommendations(updated);
  };

  // Re-generate recommendations from live teeth chart & dues
  const handleRefreshRecommendations = () => {
    const fresh = generateRecommendedServices(
      customer.teethChart,
      customer.cleaningDues,
      customer.id
    );
    onUpdateRecommendations(fresh);
  };

  // Add custom recommendation
  const handleAddCustom = () => {
    if (!customTitle.trim()) return;

    const parsedTeeth = customTeeth
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 32) as ToothNumber[];

    const newRec: RecommendedService = {
      id: `custom-rec-${Date.now()}`,
      customerId: customer.id,
      title: customTitle.trim(),
      reason: customReason.trim() || 'Clinical recommendation based on comprehensive exam.',
      priority: customPriority,
      category: customCategory,
      suggestedNextVisitTimeframe: 'Next Scheduled Visit',
      estimatedFee: customFee,
      relatedTeeth: parsedTeeth,
      preemptive: customPreemptive,
      addedToSchedule: true,
    };

    onUpdateRecommendations([...recommendations, newRec]);
    setShowCustomModal(false);
    setCustomTitle('');
    setCustomReason('');
    setCustomTeeth('');
  };

  // Calculate totals
  const totalEstimatedCost = recommendations.reduce((sum, r) => sum + r.estimatedFee, 0);
  const scheduledCount = recommendations.filter((r) => r.addedToSchedule).length;
  const scheduledCost = recommendations
    .filter((r) => r.addedToSchedule)
    .reduce((sum, r) => sum + r.estimatedFee, 0);

  const urgentCount = recommendations.filter((r) => r.priority === 'urgent').length;
  const preemptiveCount = recommendations.filter((r) => r.preemptive).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recommended Services for Next Visit
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
              Auto-Computed from Teeth Status & Cleaning Dues
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Preemptive maintenance (bruxism night guards, fluoride, cleanings) and active treatments calculated directly from {customer.firstName}'s odontogram.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefreshRecommendations}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
          >
            Re-Analyze Teeth Status
          </button>

          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Service</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Active Recommendations</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{recommendations.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Driven by clinical algorithms</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-2xs">
          <p className="text-xs font-semibold text-rose-700">Urgent Interventions</p>
          <p className="text-2xl font-black text-rose-800 mt-1">{urgentCount}</p>
          <p className="text-[11px] text-rose-600 mt-0.5">Needs immediate appointment</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-700">Preemptive Maintenance</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{preemptiveCount}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Protects wear & arrests decay</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-sky-200 shadow-2xs">
          <p className="text-xs font-semibold text-sky-700">Selected for Next Visit</p>
          <p className="text-2xl font-black text-sky-900 mt-1">
            {scheduledCount} <span className="text-xs font-semibold text-slate-500">({formatPHP(scheduledCost)} PHP)</span>
          </p>
          <p className="text-[11px] text-sky-600 mt-0.5">Ready for appointment booking</p>
        </div>
      </div>

      {/* Featured Next Visit Plan (Collapsible Hero Card) */}
      {recommendations.length > 0 && (
        <div className="bg-sky-900 rounded-xl p-4 sm:p-5 shadow-sm text-white space-y-3">
          <div className="font-bold flex items-center justify-between text-sky-200 uppercase text-xs tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="text-amber-300">★</span> Recommended for Next Visit Plan ({scheduledCount} of {recommendations.length} Selected)
            </span>
            <button
              type="button"
              onClick={() => setShowHeroPlan(!showHeroPlan)}
              className="text-sky-200 hover:text-white flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-white/10 cursor-pointer"
            >
              <span>{showHeroPlan ? 'Fold Plan' : 'Expand Plan'}</span>
              {showHeroPlan ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {showHeroPlan && (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedRecommendations.slice(0, 4).map((rec, index) => (
                  <div
                    key={`featured-${rec.id}`}
                    onClick={() => handleToggleSchedule(rec.id)}
                    className={`flex items-start p-2.5 rounded-lg cursor-pointer transition-all ${
                      rec.addedToSchedule
                        ? 'bg-white/15 border border-sky-400/40 shadow-inner'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold mr-2.5 mt-0.5 shrink-0 text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold truncate text-white">{rec.title}</div>
                        <span className="text-xs font-bold text-emerald-300 shrink-0">
                          {formatPHP(rec.estimatedFee)} PHP
                        </span>
                      </div>
                      <div className="text-[11px] text-sky-200 mt-0.5 line-clamp-1">{rec.reason}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-sky-200">
                  Total Plan Fee: <span className="font-bold text-white">{formatPHP(scheduledCost)} PHP</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allSelected = recommendations.map((r) => ({ ...r, addedToSchedule: true }));
                    onUpdateRecommendations(allSelected);
                  }}
                  className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Schedule All Recommended Care
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendation Cards List (Compact with Expanding Divs, Sorted by Urgency) */}
      <div className="space-y-2.5">
        {sortedRecommendations.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 shadow-2xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="font-bold text-sm text-slate-900">No Services Pending</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer has no untreated decay, wear, or overdue cleanings.
            </p>
          </div>
        ) : (
          sortedRecommendations.map((rec) => {
            const urg = rec.urgencyGroup
              ? URGENCY_TIERS[rec.urgencyGroup]
              : getTreatmentUrgency(rec.title);
            const isUrgent = urg.rank === 1 || rec.priority === 'urgent';
            const isHigh = urg.rank === 2 || rec.priority === 'high';
            const isExpanded = !!expandedRecIds[rec.id];

            return (
              <div
                key={rec.id}
                className={`bg-white rounded-xl border transition-all shadow-2xs overflow-hidden ${
                  rec.addedToSchedule
                    ? 'border-sky-500 ring-1 ring-sky-200'
                    : isUrgent
                    ? 'border-rose-300 bg-rose-50/15'
                    : isHigh
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Compact Header Row */}
                <div
                  onClick={() => toggleRecExpand(rec.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                    {/* Urgency Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${urg.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${urg.dotClass}`} />
                      {urg.label}
                    </span>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-xs truncate">
                      {rec.title}
                    </h3>

                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {rec.category}
                    </span>

                    {rec.relatedTeeth && rec.relatedTeeth.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800 shrink-0">
                        #{rec.relatedTeeth.join(', #')}
                      </span>
                    )}

                    {rec.preemptive && (
                      <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Preventive
                      </span>
                    )}
                  </div>

                  {/* Right Actions: Fee, Schedule Button, Expand Toggle */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {formatPHP(rec.estimatedFee)} PHP
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSchedule(rec.id);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        rec.addedToSchedule
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>{rec.addedToSchedule ? 'Queued' : 'Add to Visit'}</span>
                    </button>

                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                      title={isExpanded ? 'Fold details' : 'Expand details'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRecExpand(rec.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanding Div: Clinical Rationale & Protocols */}
                {isExpanded && (
                  <div className="p-3.5 bg-white border-t border-slate-100 text-xs space-y-2 animate-in fade-in duration-100">
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Clinical Rationale: </strong>
                      {rec.reason}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Target Timeframe: <strong className="text-slate-700">{rec.suggestedNextVisitTimeframe}</strong></span>
                      </span>
                      <span>Category: <strong className="text-slate-700">{rec.category}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Plan Action Bar */}
      {scheduledCount > 0 && (
        <div className="sticky bottom-4 z-20 bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              {scheduledCount}
            </div>
            <div>
              <p className="text-sm font-bold">
                {scheduledCount} Services Selected for Next Appointment
              </p>
              <p className="text-xs text-slate-400">
                Total Estimated Treatment Cost: <span className="text-emerald-400 font-bold">{formatPHP(scheduledCost)} PHP</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Treatment Plan Sheet</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Recommendation Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Add Custom Treatment or Preemptive Recommendation
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service / Procedure Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., In-Office Zoom Teeth Whitening"
                className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Reason & Notes
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why this service is beneficial for this patient..."
                rows={2}
                className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={customPriority}
                  onChange={(e) => setCustomPriority(e.target.value as any)}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="routine">Routine</option>
                  <option value="cosmetic">Cosmetic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white"
                >
                  <option value="Restorative">Restorative</option>
                  <option value="Preemptive Maintenance">Preemptive Maintenance</option>
                  <option value="Cosmetic">Cosmetic</option>
                  <option value="Periodontic">Periodontic</option>
                  <option value="Endodontic">Endodontic</option>
                  <option value="Oral Surgery">Oral Surgery</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Related Teeth (optional)
                </label>
                <input
                  type="text"
                  value={customTeeth}
                  onChange={(e) => setCustomTeeth(e.target.value)}
                  placeholder="e.g., 8, 9"
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Fee (PHP ₱)
                </label>
                <input
                  type="number"
                  value={customFee}
                  onChange={(e) => setCustomFee(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="preemptive-check"
                checked={customPreemptive}
                onChange={(e) => setCustomPreemptive(e.target.checked)}
                className="w-4 h-4 accent-sky-600 rounded"
              />
              <label htmlFor="preemptive-check" className="text-xs font-medium text-slate-700">
                Mark as Preemptive Preventive Maintenance
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customTitle.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                Add Recommendation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

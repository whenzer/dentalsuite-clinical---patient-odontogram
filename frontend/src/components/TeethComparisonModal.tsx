import React, { useState } from 'react';
import { Customer, TeethSnapshot, ToothNumber } from '../types';
import { compareTeethSnapshots } from '../utils/dentalRules';
import { ToothVisual } from './ToothVisual';
import { CONDITION_CONFIGS } from '../data/toothMetadata';
import { X, ArrowRight, CheckCircle2, AlertCircle, History } from 'lucide-react';

interface TeethComparisonModalProps {
  customer: Customer;
  onClose: () => void;
}

export const TeethComparisonModal: React.FC<TeethComparisonModalProps> = ({
  customer,
  onClose,
}) => {
  const snapshots = customer.teethSnapshots || [];

  // Default to comparing first snapshot (earlier) with latest or current chart
  const [earlierSnapshotId, setEarlierSnapshotId] = useState<string>(
    snapshots.length > 1 ? snapshots[0].id : 'current'
  );
  const [laterSnapshotId, setLaterSnapshotId] = useState<string>(
    snapshots.length > 1 ? snapshots[snapshots.length - 1].id : 'current'
  );

  const getChartById = (id: string) => {
    if (id === 'current') return customer.teethChart;
    const snap = snapshots.find((s) => s.id === id);
    return snap ? snap.chart : customer.teethChart;
  };

  const earlierChart = getChartById(earlierSnapshotId);
  const laterChart = getChartById(laterSnapshotId);

  const comparison = compareTeethSnapshots(earlierChart, laterChart);

  const earlierSnapObj = snapshots.find((s) => s.id === earlierSnapshotId);
  const laterSnapObj = snapshots.find((s) => s.id === laterSnapshotId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div
        id="teeth-comparison-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Teeth Status Progress & Historical Visit Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-700">{customer.firstName} {customer.lastName}</span> • Comparing teeth condition evolution across clinical visits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visit Selection Bar */}
        <div className="px-6 py-3 bg-sky-50/70 border-b border-sky-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Baseline Visit:</span>
            <select
              value={earlierSnapshotId}
              onChange={(e) => setEarlierSnapshotId(e.target.value)}
              className="text-xs font-medium rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-slate-800 shadow-xs focus:ring-2 focus:ring-sky-500"
            >
              {snapshots.map((snap) => (
                <option key={snap.id} value={snap.id}>
                  {snap.date} — {snap.visitTitle}
                </option>
              ))}
              <option value="current">Current State (Today's Active Chart)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sky-600 font-bold text-xs">
            <ArrowRight className="w-4 h-4" />
            <span>COMPARED AGAINST</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Follow-up Visit:</span>
            <select
              value={laterSnapshotId}
              onChange={(e) => setLaterSnapshotId(e.target.value)}
              className="text-xs font-medium rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-slate-800 shadow-xs focus:ring-2 focus:ring-sky-500"
            >
              <option value="current">Current State (Today's Active Chart)</option>
              {snapshots.map((snap) => (
                <option key={snap.id} value={snap.id}>
                  {snap.date} — {snap.visitTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Summary Metrics */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-emerald-800 leading-tight">
                {comparison.summary.improvedOrTreated}
              </p>
              <p className="text-xs text-emerald-700 font-medium">Teeth Successfully Treated / Improved</p>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-rose-800 leading-tight">
                {comparison.summary.newIssuesOrWorsened}
              </p>
              <p className="text-xs text-rose-700 font-medium">New Conditions or Progressed Wear</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-800 leading-tight">
                {comparison.summary.totalChanged} / 32
              </p>
              <p className="text-xs text-slate-600 font-medium">Total Teeth With Condition Shifts</p>
            </div>
          </div>
        </div>

        {/* Modal Content - Differences Table & Highlighted Teeth */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Differences Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
              <span>Detailed Condition Shift Log</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
                {comparison.differences.length} changes detected
              </span>
            </h4>

            {comparison.differences.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-sm text-slate-800">No condition changes found</p>
                <p className="text-xs mt-1">All 32 teeth conditions remained identical between these two records.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Tooth #</th>
                      <th className="py-2.5 px-4">Previous Visit ({earlierSnapObj?.date || 'Baseline'})</th>
                      <th className="py-2.5 px-4">Follow-up Visit ({laterSnapObj?.date || 'Current'})</th>
                      <th className="py-2.5 px-4">Clinical Impact</th>
                      <th className="py-2.5 px-4">Notes & Observation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparison.differences.map((diff) => {
                      const prevConf = CONDITION_CONFIGS[diff.previousCondition as keyof typeof CONDITION_CONFIGS];
                      const currConf = CONDITION_CONFIGS[diff.currentCondition as keyof typeof CONDITION_CONFIGS];

                      return (
                        <tr key={diff.toothNumber} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-sky-100 text-sky-800 text-xs font-bold mr-2">
                              #{diff.toothNumber}
                            </span>
                            {diff.toothName}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${prevConf?.badgeBg || 'bg-slate-100'} ${prevConf?.badgeText || 'text-slate-700'}`}>
                              {prevConf?.label || diff.previousCondition}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${currConf?.badgeBg || 'bg-slate-100'} ${currConf?.badgeText || 'text-slate-700'}`}>
                              {currConf?.label || diff.currentCondition}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {diff.changeType === 'treated' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Restored / Treated
                              </span>
                            )}
                            {diff.changeType === 'new_issue' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> New Pathology
                              </span>
                            )}
                            {diff.changeType === 'worsened' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Worsened
                              </span>
                            )}
                            {diff.changeType === 'improved' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                Improved
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 leading-relaxed">
                            {diff.description}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Side-by-side Odontogram view of Changed Teeth */}
          {comparison.differences.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                Visual Comparison of Affected Teeth
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {comparison.differences.map((diff) => {
                  const toothNum = diff.toothNumber;
                  return (
                    <div
                      key={toothNum}
                      className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-center flex flex-col items-center shadow-2xs"
                    >
                      <span className="text-[11px] font-bold text-slate-700 mb-1">
                        #{toothNum}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-slate-400 font-semibold mb-0.5">Previous</span>
                          <ToothVisual
                            toothNumber={toothNum}
                            data={earlierChart[toothNum]}
                            size="sm"
                            showLabel={false}
                          />
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 mt-2 shrink-0" />
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-sky-600 font-semibold mb-0.5">Follow-up</span>
                          <ToothVisual
                            toothNumber={toothNum}
                            data={laterChart[toothNum]}
                            size="sm"
                            showLabel={false}
                            highlightDifference={diff.changeType}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-xs transition-colors"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};

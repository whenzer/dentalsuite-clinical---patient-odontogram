import React, { useState } from 'react';
import { Customer, TeethChartState, TeethSnapshot, ToothData, ToothNumber } from '../types';
import { ToothVisual } from './ToothVisual';
import { ToothEditorModal } from './ToothEditorModal';
import { TeethComparisonModal } from './TeethComparisonModal';
import { CONDITION_CONFIGS, TOOTH_METADATA } from '../data/toothMetadata';
import {
  Camera,
  History,
  Save,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface OdontogramProps {
  customer: Customer;
  onUpdateChart: (updatedChart: TeethChartState) => void;
  onSaveSnapshot: (snapshot: TeethSnapshot) => void;
  onOpenPresentation: () => void;
  onNavigateToPhotos?: () => void;
}

export const Odontogram: React.FC<OdontogramProps> = ({
  customer,
  onUpdateChart,
  onSaveSnapshot,
  onOpenPresentation,
  onNavigateToPhotos,
}) => {
  const [selectedTooth, setSelectedTooth] = useState<ToothNumber | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);

  const chart = customer.teethChart;

  // Upper Arch (1 to 16)
  const upperTeeth: ToothNumber[] = Array.from({ length: 16 }, (_, i) => (i + 1) as ToothNumber);
  // Lower Arch (32 down to 17 or 17 to 32)
  const lowerTeeth: ToothNumber[] = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

  const handleToothClick = (toothNum: ToothNumber) => {
    setSelectedTooth(toothNum);
    setIsEditorOpen(true);
  };

  const handleSaveTooth = (updated: ToothData) => {
    const nextChart = {
      ...chart,
      [updated.number]: updated,
    };
    onUpdateChart(nextChart);
  };

  const handleCreateSnapshot = () => {
    if (!snapshotTitle.trim()) return;
    const newSnapshot: TeethSnapshot = {
      id: `snap-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      visitTitle: snapshotTitle.trim(),
      notes: `Archived teeth chart state during consultation.`,
      chart: JSON.parse(JSON.stringify(chart)),
    };
    onSaveSnapshot(newSnapshot);
    setSnapshotTitle('');
    setShowSnapshotDialog(false);
  };

  // Status counts for legend
  const conditionCounts: Record<string, number> = {};
  const teethList = Object.values(chart) as ToothData[];
  teethList.forEach((t) => {
    conditionCounts[t.condition] = (conditionCounts[t.condition] || 0) + 1;
  });

  // Highlight teeth requiring attention
  const teethNeedingAttention = teethList.filter((t) =>
    ['rotted', 'large_cavity', 'moderate_cavity', 'small_cavity', 'weared_dentin', 'calculus_tartar'].includes(
      t.condition
    )
  );

  return (
    <div className="space-y-6">
      {/* Top Controls & Status Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🦷</span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Interactive 32-Tooth Odontogram Chart
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">
              Universal Numbering (#1 - #32)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Click any tooth to examine surfaces, update conditions (cavities, wear, root canals, rotted), or adjust pocket depths.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="compare-teeth-visits-btn"
            onClick={() => setIsCompareOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <History className="w-4 h-4 text-sky-600" />
            <span>Compare Visits ({customer.teethSnapshots?.length || 0})</span>
          </button>

          <button
            type="button"
            id="save-teeth-snapshot-btn"
            onClick={() => setShowSnapshotDialog(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4 text-emerald-600" />
            <span>Save to Visit Log</span>
          </button>

          <button
            type="button"
            id="show-to-customer-btn"
            onClick={onOpenPresentation}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-2 transition-colors"
          >
            <Presentation className="w-4 h-4" />
            <span>Show to Customer Mode</span>
          </button>
        </div>
      </div>

      {/* Snapshot Save Dialog Popup */}
      {showSnapshotDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Save Teeth Status Snapshot for {customer.firstName} {customer.lastName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              This locks the current 32-teeth condition in the customer's permanent record so you can compare it on their next recall visit.
            </p>
            <input
              type="text"
              value={snapshotTitle}
              onChange={(e) => setSnapshotTitle(e.target.value)}
              placeholder="e.g., Routine 6-Month Recall & Cavity Check"
              className="w-full text-xs rounded-xl border border-slate-300 py-2.5 px-3 mb-4 focus:ring-2 focus:ring-sky-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSnapshotDialog(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSnapshot}
                disabled={!snapshotTitle.trim()}
                className="px-4 py-1.5 text-xs font-bold bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
              >
                Archive Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attention Alert Bar (if cavities, rotted, or weared dentin present) */}
      {teethNeedingAttention.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-900">
              {teethNeedingAttention.length} Teeth Identified Requiring Clinical Treatment or Preemptive Maintenance:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {teethNeedingAttention.map((t) => {
                const conf = CONDITION_CONFIGS[t.condition];
                return (
                  <button
                    key={t.number}
                    onClick={() => handleToothClick(t.number)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-950 shadow-2xs hover:bg-amber-100 transition-colors"
                  >
                    <span className="font-bold text-sky-700">#{t.number}</span>
                    <span>{TOOTH_METADATA[t.number]?.shortName}:</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${conf.badgeBg} ${conf.badgeText}`}>
                      {conf.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Odontogram Canvas Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 overflow-x-auto">
        <div className="min-w-[900px] flex flex-col items-center">
          {/* Upper Arch Container */}
          <div className="w-full bg-slate-50/60 rounded-2xl p-5 border border-slate-100 mb-6">
            <div className="flex items-center justify-between mb-3 px-2 border-b border-slate-200/80 pb-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Maxillary Arch (Upper Teeth #1 - #16)
              </span>
              <div className="flex items-center gap-8 text-[11px] font-semibold text-slate-600">
                <span>← Upper Right (UR #1 - #8)</span>
                <span className="text-slate-300">|</span>
                <span>Upper Left (UL #9 - #16) →</span>
              </div>
            </div>

            {/* Upper Teeth Row */}
            <div className="flex justify-between items-center gap-1.5 px-2">
              {upperTeeth.map((num) => (
                <ToothVisual
                  key={num}
                  toothNumber={num}
                  data={chart[num]}
                  isSelected={selectedTooth === num}
                  onClick={() => handleToothClick(num)}
                />
              ))}
            </div>
          </div>

          {/* Central Arch Divider & Occlusal Plane */}
          <div className="w-full flex items-center justify-center my-1 relative">
            <div className="h-[1.5px] w-full bg-slate-200" />
            <span className="absolute px-4 py-0.5 bg-white border border-slate-200 text-[10px] font-bold tracking-widest uppercase text-slate-400 rounded-full shadow-2xs">
              Midline & Occlusal Plane
            </span>
          </div>

          {/* Lower Arch Container */}
          <div className="w-full bg-slate-50/60 rounded-2xl p-5 border border-slate-100 mt-6">
            {/* Lower Teeth Row: arranged from 32 to 17 (Right to Left visually) */}
            <div className="flex justify-between items-center gap-1.5 px-2">
              {lowerTeeth.map((num) => (
                <ToothVisual
                  key={num}
                  toothNumber={num}
                  data={chart[num]}
                  isSelected={selectedTooth === num}
                  onClick={() => handleToothClick(num)}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 px-2 border-t border-slate-200/80 pt-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Mandibular Arch (Lower Teeth #17 - #32)
              </span>
              <div className="flex items-center gap-8 text-[11px] font-semibold text-slate-600">
                <span>← Lower Right (LR #32 - #25)</span>
                <span className="text-slate-300">|</span>
                <span>Lower Left (LL #24 - #17) →</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Code Legend & Pathology Summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-sky-600" />
          <span>Odontogram Condition Legend & Status Distribution</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {Object.entries(CONDITION_CONFIGS).map(([key, config]) => {
            const count = conditionCounts[key] || 0;
            return (
              <div
                key={key}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 border"
                    style={{ backgroundColor: config.chartStroke, borderColor: config.chartStroke }}
                  />
                  <span className="font-medium text-slate-700 truncate">{config.label}</span>
                </div>
                <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-white text-slate-800 border border-slate-200 shadow-2xs">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooth Detail Editor Modal */}
      {isEditorOpen && selectedTooth && (
        <ToothEditorModal
          toothNumber={selectedTooth}
          toothData={chart[selectedTooth]}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveTooth}
        />
      )}

      {/* Comparison Modal */}
      {isCompareOpen && (
        <TeethComparisonModal
          customer={customer}
          onClose={() => setIsCompareOpen(false)}
        />
      )}
    </div>
  );
};

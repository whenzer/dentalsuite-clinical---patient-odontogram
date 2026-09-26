import React, { useState } from 'react';
import { ToothCondition, ToothData, ToothNumber, ToothSurface } from '../types';
import { CONDITION_CONFIGS, TOOTH_METADATA } from '../data/toothMetadata';
import { X, Check, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface ToothEditorModalProps {
  toothNumber: ToothNumber | null;
  toothData: ToothData | null;
  onClose: () => void;
  onSave: (updatedData: ToothData) => void;
}

const ALL_CONDITIONS: ToothCondition[] = [
  'healthy',
  'small_cavity',
  'moderate_cavity',
  'large_cavity',
  'rotted',
  'weared_dentin',
  'calculus_tartar',
  'filling',
  'crown',
  'root_canal',
  'implant',
  'veneer',
  'growing_impacted',
  'erupted',
  'missing',
];

const SURFACES: { id: ToothSurface; label: string; key: string }[] = [
  { id: 'occlusal', label: 'Occlusal (Chewing surface)', key: 'O' },
  { id: 'incisal', label: 'Incisal (Biting edge)', key: 'I' },
  { id: 'mesial', label: 'Mesial (Front toward midline)', key: 'M' },
  { id: 'distal', label: 'Distal (Back away from midline)', key: 'D' },
  { id: 'buccal', label: 'Buccal / Facial (Cheek side)', key: 'B' },
  { id: 'lingual', label: 'Lingual (Tongue / Palate side)', key: 'L' },
];

export const ToothEditorModal: React.FC<ToothEditorModalProps> = ({
  toothNumber,
  toothData,
  onClose,
  onSave,
}) => {
  if (!toothNumber || !toothData) return null;

  const meta = TOOTH_METADATA[toothNumber];
  const [condition, setCondition] = useState<ToothCondition>(toothData.condition);
  const [surfaces, setSurfaces] = useState<ToothSurface[]>(toothData.surfaces || []);
  const [notes, setNotes] = useState<string>(toothData.notes || '');
  const [pocketDepth, setPocketDepth] = useState<number>(toothData.pocketDepthMm || 2);
  const [mobility, setMobility] = useState<0 | 1 | 2 | 3>(toothData.mobility || 0);

  const toggleSurface = (surface: ToothSurface) => {
    if (surfaces.includes(surface)) {
      setSurfaces(surfaces.filter((s) => s !== surface));
    } else {
      setSurfaces([...surfaces, surface]);
    }
  };

  const handleSave = () => {
    onSave({
      ...toothData,
      condition,
      surfaces,
      notes,
      pocketDepthMm: pocketDepth,
      mobility,
    });
    onClose();
  };

  const selectedConfig = CONDITION_CONFIGS[condition] || CONDITION_CONFIGS.healthy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="tooth-editor-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
              #{toothNumber}
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                {meta.name}
              </h3>
              <p className="text-xs text-slate-500">
                Quadrant {meta.quadrant} • {meta.arch.toUpperCase()} ARCH • {meta.type.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-tooth-modal-button"
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick preset actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCondition('healthy');
                setSurfaces([]);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Mark Healthy
            </button>
            <button
              type="button"
              onClick={() => {
                setCondition('filling');
                if (!surfaces.includes('occlusal')) setSurfaces([...surfaces, 'occlusal']);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Mark Restored (Filling)
            </button>
            <button
              type="button"
              onClick={() => setCondition('weared_dentin')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Weared Dentin
            </button>
          </div>

          {/* Condition Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Teeth Status / Condition
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_CONDITIONS.map((cond) => {
                const conf = CONDITION_CONFIGS[cond];
                const isCurrent = condition === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`text-left p-2 rounded-xl border text-xs font-medium transition-all flex flex-col justify-between ${
                      isCurrent
                        ? `${conf.badgeBg} ${conf.badgeText} border-sky-500 shadow-xs ring-2 ring-sky-400/40`
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{conf.label}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patient-Friendly Explanation Callout */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sky-950">Patient Presentation Note:</p>
              <p className="mt-0.5 text-sky-800 leading-relaxed">
                {selectedConfig.patientExplanation}
              </p>
            </div>
          </div>

          {/* Affected Surfaces */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Affected Tooth Surfaces
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SURFACES.map((surf) => {
                const isSelected = surfaces.includes(surf.id);
                return (
                  <button
                    key={surf.id}
                    type="button"
                    onClick={() => toggleSurface(surf.id)}
                    className={`px-3 py-2 rounded-lg border text-xs text-left transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{surf.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {surf.key}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Periodontal Probing & Mobility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Periodontal Probing Depth (mm)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={pocketDepth}
                  onChange={(e) => setPocketDepth(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
                <span
                  className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                    pocketDepth > 4 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {pocketDepth} mm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tooth Mobility Grade
              </label>
              <select
                value={mobility}
                onChange={(e) => setMobility(Number(e.target.value) as 0 | 1 | 2 | 3)}
                className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value={0}>Class 0 (Physiological mobility)</option>
                <option value={1}>Class 1 (Slight: &lt; 1mm horizontal)</option>
                <option value={2}>Class 2 (Moderate: 1-2mm horizontal)</option>
                <option value={3}>Class 3 (Severe: &gt; 2mm or vertical depression)</option>
              </select>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Tooth Specific Clinical Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Sensitive to cold air, mesial marginal ridge undermined, cold test responsive..."
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-800"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            id="save-tooth-changes-button"
            className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save Tooth #{toothNumber}
          </button>
        </div>
      </div>
    </div>
  );
};

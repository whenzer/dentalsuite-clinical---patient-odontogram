import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Customer, ToothNumber, ToothData, TeethChartState, ToothCondition } from '../types';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  FileEdit,
  Brush,
  Layers,
  Info,
  Check,
  X,
  AlertCircle,
  Stethoscope,
  Smile,
  Save,
} from 'lucide-react';

export interface DentalChartingTabProps {
  customer: Customer;
  onUpdateChart?: (updatedChart: TeethChartState) => void;
  onSaveChart?: (updatedChart: TeethChartState) => Promise<void>;
}

export interface ColorSchemeItem {
  id: string;
  name: string;
  condition: ToothCondition;
  color: string;
  textColor: string;
  borderColor: string;
  description: string;
}

export const COLOR_SCHEMES: ColorSchemeItem[] = [
  {
    id: 'healthy',
    name: 'Healthy / Sound',
    condition: 'healthy',
    color: '#10b981',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-400',
    description: 'Natural intact enamel with no active pathology',
  },
  {
    id: 'cavity',
    name: 'Caries / Decay',
    condition: 'large_cavity',
    color: '#ef4444',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-400',
    description: 'Active carious lesion requiring restoration',
  },
  {
    id: 'filling',
    name: 'Existing Filling',
    condition: 'filling',
    color: '#3b82f6',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-400',
    description: 'Composite resin or amalgam restoration',
  },
  {
    id: 'crown',
    name: 'Crown / Cap',
    condition: 'crown',
    color: '#f59e0b',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-400',
    description: 'Full-coverage ceramic or gold crown',
  },
  {
    id: 'root_canal',
    name: 'Root Canal',
    condition: 'root_canal',
    color: '#8b5cf6',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-400',
    description: 'Endodontically treated pulp chamber',
  },
  {
    id: 'tartar',
    name: 'Calculus / Tartar',
    condition: 'calculus_tartar',
    color: '#ea580c',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-400',
    description: 'Supra/subgingival hard deposit',
  },
  {
    id: 'sealant',
    name: 'Sealant',
    condition: 'erupted',
    color: '#06b6d4',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-400',
    description: 'Preventive resin pit and fissure sealant',
  },
  {
    id: 'veneer',
    name: 'Veneer',
    condition: 'veneer',
    color: '#ec4899',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-400',
    description: 'Cosmetic labial porcelain facing',
  },
  {
    id: 'missing',
    name: 'Missing / Extracted',
    condition: 'missing',
    color: '#64748b',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    description: 'Tooth absent or extracted',
  },
  {
    id: 'unmarked',
    name: 'Clear / Unmarked',
    condition: 'healthy',
    color: '#ffffff',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    description: 'Neutral white default state',
  },
];

export const TOOTH_NAMES: Record<number, { name: string; type: string; quad: number; quadName: string }> = {
  1: { name: 'Upper Right 3rd Molar (Wisdom)', type: 'Molar', quad: 1, quadName: 'Quadrant 1 (UR)' },
  2: { name: 'Upper Right 2nd Molar', type: 'Molar', quad: 1, quadName: 'Quadrant 1 (UR)' },
  3: { name: 'Upper Right 1st Molar', type: 'Molar', quad: 1, quadName: 'Quadrant 1 (UR)' },
  4: { name: 'Upper Right 2nd Premolar', type: 'Premolar', quad: 1, quadName: 'Quadrant 1 (UR)' },
  5: { name: 'Upper Right 1st Premolar', type: 'Premolar', quad: 1, quadName: 'Quadrant 1 (UR)' },
  6: { name: 'Upper Right Canine', type: 'Canine', quad: 1, quadName: 'Quadrant 1 (UR)' },
  7: { name: 'Upper Right Lateral Incisor', type: 'Incisor', quad: 1, quadName: 'Quadrant 1 (UR)' },
  8: { name: 'Upper Right Central Incisor', type: 'Incisor', quad: 1, quadName: 'Quadrant 1 (UR)' },

  9: { name: 'Upper Left Central Incisor', type: 'Incisor', quad: 2, quadName: 'Quadrant 2 (UL)' },
  10: { name: 'Upper Left Lateral Incisor', type: 'Incisor', quad: 2, quadName: 'Quadrant 2 (UL)' },
  11: { name: 'Upper Left Canine', type: 'Canine', quad: 2, quadName: 'Quadrant 2 (UL)' },
  12: { name: 'Upper Left 1st Premolar', type: 'Premolar', quad: 2, quadName: 'Quadrant 2 (UL)' },
  13: { name: 'Upper Left 2nd Premolar', type: 'Premolar', quad: 2, quadName: 'Quadrant 2 (UL)' },
  14: { name: 'Upper Left 1st Molar', type: 'Molar', quad: 2, quadName: 'Quadrant 2 (UL)' },
  15: { name: 'Upper Left 2nd Molar', type: 'Molar', quad: 2, quadName: 'Quadrant 2 (UL)' },
  16: { name: 'Upper Left 3rd Molar (Wisdom)', type: 'Molar', quad: 2, quadName: 'Quadrant 2 (UL)' },

  17: { name: 'Lower Left 3rd Molar (Wisdom)', type: 'Molar', quad: 3, quadName: 'Quadrant 3 (LL)' },
  18: { name: 'Lower Left 2nd Molar', type: 'Molar', quad: 3, quadName: 'Quadrant 3 (LL)' },
  19: { name: 'Lower Left 1st Molar', type: 'Molar', quad: 3, quadName: 'Quadrant 3 (LL)' },
  20: { name: 'Lower Left 2nd Premolar', type: 'Premolar', quad: 3, quadName: 'Quadrant 3 (LL)' },
  21: { name: 'Lower Left 1st Premolar', type: 'Premolar', quad: 3, quadName: 'Quadrant 3 (LL)' },
  22: { name: 'Lower Left Canine', type: 'Canine', quad: 3, quadName: 'Quadrant 3 (LL)' },
  23: { name: 'Lower Left Lateral Incisor', type: 'Incisor', quad: 3, quadName: 'Quadrant 3 (LL)' },
  24: { name: 'Lower Left Central Incisor', type: 'Incisor', quad: 3, quadName: 'Quadrant 3 (LL)' },

  25: { name: 'Lower Right Central Incisor', type: 'Incisor', quad: 4, quadName: 'Quadrant 4 (LR)' },
  26: { name: 'Lower Right Lateral Incisor', type: 'Incisor', quad: 4, quadName: 'Quadrant 4 (LR)' },
  27: { name: 'Lower Right Canine', type: 'Canine', quad: 4, quadName: 'Quadrant 4 (LR)' },
  28: { name: 'Lower Right 1st Premolar', type: 'Premolar', quad: 4, quadName: 'Quadrant 4 (LR)' },
  29: { name: 'Lower Right 2nd Premolar', type: 'Premolar', quad: 4, quadName: 'Quadrant 4 (LR)' },
  30: { name: 'Lower Right 1st Molar', type: 'Molar', quad: 4, quadName: 'Quadrant 4 (LR)' },
  31: { name: 'Lower Right 2nd Molar', type: 'Molar', quad: 4, quadName: 'Quadrant 4 (LR)' },
  32: { name: 'Lower Right 3rd Molar (Wisdom)', type: 'Molar', quad: 4, quadName: 'Quadrant 4 (LR)' },
};

export const QUICK_NOTE_PRESETS = [
  'Deep occlusal caries detected',
  'Cold & air sensitivity present',
  'Interproximal food impaction',
  'Defective composite margin',
  'Recommended for ceramic crown',
  'Cracked cusp syndrome',
  'Endodontic evaluation required',
  'Intact restoration, monitor at recall',
  'Gingival recession & root exposure',
  'Calculus accumulation, scaling indicated',
];

type SegmentKey = 'top' | 'right' | 'bottom' | 'left' | 'center';

export const DentalChartingTab: React.FC<DentalChartingTabProps> = ({
  customer,
  onUpdateChart,
  onSaveChart,
}) => {
  // Local chart state synchronized with customer.teethChart
  const [chart, setChart] = useState<TeethChartState>(() => customer.teethChart || {});

  // Active color tool from the palette
  const [selectedScheme, setSelectedScheme] = useState<ColorSchemeItem>(COLOR_SCHEMES[1]); // Default to Caries/Decay for fast charting

  // Color application mode: 'segment' (apply to clicked surface) or 'entire_tooth' (apply to all 5 segments)
  const [paintMode, setPaintMode] = useState<'segment' | 'entire_tooth'>('segment');

  // Currently focused tooth for note taking or deep inspection
  const [selectedToothNum, setSelectedToothNum] = useState<number | null>(3);
  const [editingNote, setEditingNote] = useState<string>('');
  const [noteSaveMessage, setNoteSaveMessage] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const latestChartRef = useRef(chart);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    latestChartRef.current = chart;
  }, [chart]);

  const persistChart = async () => {
    if (!onSaveChart || !dirtyRef.current || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await onSaveChart(latestChartRef.current);
      dirtyRef.current = false;
      setIsDirty(false);
      setSaveMessage('Saved');
    } catch {
      setSaveMessage('Save failed');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      void persistChart();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [onSaveChart]);

  const commitChart = (nextChart: TeethChartState) => {
    setChart(nextChart);
    dirtyRef.current = true;
    setIsDirty(true);
    setSaveMessage(null);
    onUpdateChart?.(nextChart);
  };

  // Sync when customer changes
  React.useEffect(() => {
    if (customer.teethChart) {
      setChart(customer.teethChart);
    }
  }, [customer.id, customer.teethChart]);

  // Update editingNote when selected tooth changes
  React.useEffect(() => {
    if (selectedToothNum) {
      setEditingNote(chart[selectedToothNum]?.notes || '');
    }
  }, [selectedToothNum, chart]);

  // Helper to get tooth colors
  const getToothColors = (toothNum: number) => {
    const t = chart[toothNum];
    const surfaceColors = t?.surfaceColors || {};
    // If no surface colors, derive default from condition
    let defaultColor = '#ffffff';
    if (t?.condition === 'healthy') defaultColor = '#10b981';
    else if (t?.condition === 'large_cavity' || t?.condition === 'rotted' || t?.condition === 'moderate_cavity' || t?.condition === 'small_cavity') defaultColor = '#ef4444';
    else if (t?.condition === 'filling') defaultColor = '#3b82f6';
    else if (t?.condition === 'crown') defaultColor = '#f59e0b';
    else if (t?.condition === 'root_canal') defaultColor = '#8b5cf6';
    else if (t?.condition === 'calculus_tartar') defaultColor = '#ea580c';
    else if (t?.condition === 'missing') defaultColor = '#64748b';
    else if (t?.condition === 'veneer') defaultColor = '#ec4899';

    return {
      top: surfaceColors.top || defaultColor,
      right: surfaceColors.right || defaultColor,
      bottom: surfaceColors.bottom || defaultColor,
      left: surfaceColors.left || defaultColor,
      center: surfaceColors.center || defaultColor,
    };
  };

  // Handle painting a segment or entire tooth
  const handleSegmentClick = (
    e: React.MouseEvent,
    toothNum: number,
    segment: SegmentKey
  ) => {
    e.stopPropagation();
    setSelectedToothNum(toothNum);

    const existingTooth = chart[toothNum] || {
      number: toothNum,
      condition: 'healthy',
      surfaces: [],
      notes: '',
    };

    const currentColors = getToothColors(toothNum);
    let nextColors: Record<SegmentKey, string>;

    if (paintMode === 'entire_tooth') {
      nextColors = {
        top: selectedScheme.color,
        right: selectedScheme.color,
        bottom: selectedScheme.color,
        left: selectedScheme.color,
        center: selectedScheme.color,
      };
    } else {
      nextColors = {
        ...currentColors,
        [segment]: selectedScheme.color,
      };
    }

    const updatedTooth: ToothData = {
      ...existingTooth,
      condition: selectedScheme.condition,
      surfaceColors: nextColors,
    };

    const nextChart: TeethChartState = {
      ...chart,
      [toothNum]: updatedTooth,
    };

    commitChart(nextChart);
  };

  // Color entire tooth in one action
  const handleColorEntireTooth = (toothNum: number, scheme: ColorSchemeItem) => {
    const existingTooth = chart[toothNum] || {
      number: toothNum,
      condition: 'healthy',
      surfaces: [],
      notes: '',
    };

    const updatedTooth: ToothData = {
      ...existingTooth,
      condition: scheme.condition,
      surfaceColors: {
        top: scheme.color,
        right: scheme.color,
        bottom: scheme.color,
        left: scheme.color,
        center: scheme.color,
      },
    };

    const nextChart: TeethChartState = {
      ...chart,
      [toothNum]: updatedTooth,
    };

    commitChart(nextChart);
  };

  // Save notes for the active tooth
  const handleSaveNote = () => {
    if (!selectedToothNum) return;
    const existing = chart[selectedToothNum] || {
      number: selectedToothNum,
      condition: 'healthy',
      surfaces: [],
      notes: '',
    };

    const nextChart: TeethChartState = {
      ...chart,
      [selectedToothNum]: {
        ...existing,
        notes: editingNote.trim(),
      },
    };

    commitChart(nextChart);
    setNoteSaveMessage(true);
    setTimeout(() => setNoteSaveMessage(false), 2000);
  };

  // Quick preset note insertion
  const handleAddPresetNote = (preset: string) => {
    setEditingNote((prev) => (prev ? `${prev}. ${preset}` : preset));
  };

  // Mark all teeth in a quadrant as healthy
  const handleMarkQuadrantHealthy = (teethList: number[]) => {
    const nextChart: TeethChartState = { ...chart };
    teethList.forEach((num) => {
      const existing = nextChart[num] || {
        number: num,
        condition: 'healthy',
        surfaces: [],
        notes: '',
      };
      nextChart[num] = {
        ...existing,
        condition: 'healthy',
        surfaceColors: {
          top: '#10b981',
          right: '#10b981',
          bottom: '#10b981',
          left: '#10b981',
          center: '#10b981',
        },
      };
    });
    commitChart(nextChart);
  };

  // Reset entire chart to natural sound enamel
  const handleResetAllTeeth = () => {
    if (!window.confirm('Reset all 32 teeth to natural sound (Healthy)?')) return;
    const nextChart: TeethChartState = {};
    for (let i = 1; i <= 32; i++) {
      nextChart[i] = {
        number: i,
        condition: 'healthy',
        surfaces: [],
        notes: '',
        surfaceColors: {
          top: '#10b981',
          right: '#10b981',
          bottom: '#10b981',
          left: '#10b981',
          center: '#10b981',
        },
      };
    }
    commitChart(nextChart);
  };

  // Define teeth for the 4 Quadrants
  // Q1 (UR): 1 to 8 (Wisdom to Central Incisor)
  const quadrant1Teeth = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8], []);
  // Q2 (UL): 9 to 16 (Central Incisor to Wisdom)
  const quadrant2Teeth = useMemo(() => [9, 10, 11, 12, 13, 14, 15, 16], []);
  // Q3 (LL): 17 to 24 (Wisdom to Central Incisor or 24 down to 17)
  const quadrant3Teeth = useMemo(() => [24, 23, 22, 21, 20, 19, 18, 17], []);
  // Q4 (LR): 25 to 32 (Central Incisor to Wisdom)
  const quadrant4Teeth = useMemo(() => [25, 26, 27, 28, 29, 30, 31, 32], []);

  // Summary counts
  const stats = useMemo(() => {
    let cariesCount = 0;
    let filledCount = 0;
    let crownCount = 0;
    let missingCount = 0;
    let notesCount = 0;

    (Object.values(chart) as ToothData[]).forEach((t) => {
      if (t.notes && t.notes.trim().length > 0) notesCount++;
      if (t.condition === 'large_cavity' || t.condition === 'rotted' || t.condition === 'moderate_cavity' || t.condition === 'small_cavity') {
        cariesCount++;
      } else if (t.condition === 'filling') {
        filledCount++;
      } else if (t.condition === 'crown') {
        crownCount++;
      } else if (t.condition === 'missing') {
        missingCount++;
      }
    });

    return { cariesCount, filledCount, crownCount, missingCount, notesCount };
  }, [chart]);

  // Render a single 5-segment circular tooth
  const renderToothCircle = (toothNum: number) => {
    const colors = getToothColors(toothNum);
    const toothInfo = TOOTH_NAMES[toothNum];
    const isSelected = selectedToothNum === toothNum;
    const hasNotes = !!chart[toothNum]?.notes && chart[toothNum]!.notes!.trim().length > 0;

    return (
      <div
        key={toothNum}
        onClick={() => setSelectedToothNum(toothNum)}
        className={`group relative flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
          isSelected
            ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-300 shadow-sm'
            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Tooth Number & Note Indicator */}
        <div className="flex items-center justify-between w-full mb-1 px-0.5">
          <span
            className={`text-xs font-black px-1.5 py-0.5 rounded ${
              isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            #{toothNum}
          </span>
          {hasNotes && (
            <span
              className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 rounded px-1 font-bold flex items-center gap-0.5"
              title={`Notes on Tooth #${toothNum}: ${chart[toothNum]?.notes}`}
            >
              📝
            </span>
          )}
        </div>

        {/* 5-Segment Circle SVG */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 my-1">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-xs select-none"
          >
            {/* Top External Segment (Buccal / Facial) */}
            <path
              d="M 18.9 18.9 A 44 44 0 0 1 81.1 18.9 L 62.7 37.3 A 18 18 0 0 0 37.3 37.3 Z"
              fill={colors.top}
              stroke="#64748b"
              strokeWidth="2"
              className="cursor-pointer transition-all hover:brightness-110 active:scale-95"
              onClick={(e) => handleSegmentClick(e, toothNum, 'top')}
            >
              <title>Tooth #{toothNum} - Buccal / Facial Surface (Top)</title>
            </path>

            {/* Right External Segment (Distal / Mesial) */}
            <path
              d="M 81.1 18.9 A 44 44 0 0 1 81.1 81.1 L 62.7 62.7 A 18 18 0 0 0 62.7 37.3 Z"
              fill={colors.right}
              stroke="#64748b"
              strokeWidth="2"
              className="cursor-pointer transition-all hover:brightness-110 active:scale-95"
              onClick={(e) => handleSegmentClick(e, toothNum, 'right')}
            >
              <title>Tooth #{toothNum} - Right Surface</title>
            </path>

            {/* Bottom External Segment (Lingual / Palatal) */}
            <path
              d="M 81.1 81.1 A 44 44 0 0 1 18.9 81.1 L 37.3 62.7 A 18 18 0 0 0 62.7 62.7 Z"
              fill={colors.bottom}
              stroke="#64748b"
              strokeWidth="2"
              className="cursor-pointer transition-all hover:brightness-110 active:scale-95"
              onClick={(e) => handleSegmentClick(e, toothNum, 'bottom')}
            >
              <title>Tooth #{toothNum} - Lingual / Palatal Surface (Bottom)</title>
            </path>

            {/* Left External Segment (Mesial / Distal) */}
            <path
              d="M 18.9 81.1 A 44 44 0 0 1 18.9 18.9 L 37.3 37.3 A 18 18 0 0 0 37.3 62.7 Z"
              fill={colors.left}
              stroke="#64748b"
              strokeWidth="2"
              className="cursor-pointer transition-all hover:brightness-110 active:scale-95"
              onClick={(e) => handleSegmentClick(e, toothNum, 'left')}
            >
              <title>Tooth #{toothNum} - Left Surface</title>
            </path>

            {/* 1 Internal Circle (Occlusal / Incisal) */}
            <circle
              cx="50"
              cy="50"
              r="18"
              fill={colors.center}
              stroke="#64748b"
              strokeWidth="2"
              className="cursor-pointer transition-all hover:brightness-110 active:scale-95"
              onClick={(e) => handleSegmentClick(e, toothNum, 'center')}
            >
              <title>Tooth #{toothNum} - Occlusal / Incisal Center Surface</title>
            </circle>
          </svg>
        </div>

        {/* Tooth Type Caption */}
        <span className="text-[10px] text-slate-500 font-medium truncate max-w-full text-center mt-0.5">
          {toothInfo?.type}
        </span>

        {/* Quick Entire Tooth Color Button (visible on hover or when selected) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleColorEntireTooth(toothNum, selectedScheme);
          }}
          className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors w-full text-center cursor-pointer ${
            isSelected
              ? 'bg-sky-100 hover:bg-sky-200 text-sky-800'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
          title={`Color all 5 segments with active color (${selectedScheme.name})`}
        >
          All {selectedScheme.name.split('/')[0]}
        </button>
      </div>
    );
  };

  const selectedToothInfo = selectedToothNum ? TOOTH_NAMES[selectedToothNum] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Top Banner: Clinical Charting Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <Stethoscope className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              Interactive 4-Quadrant Odontogram Charting
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Universal 32-tooth chart divided into 4 anatomical quadrants. Each tooth features 5 clickable surfaces (4 external parts & 1 central occlusal circle). Choose a color brush to paint individual segments or entire teeth, and record clinical notes.
          </p>
        </div>

        {/* Quick Metric Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
            🟢 Sound: {32 - stats.cariesCount - stats.missingCount}
          </span>
          {stats.cariesCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
              🔴 Caries: {stats.cariesCount}
            </span>
          )}
          {stats.filledCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold">
              🔵 Restored: {stats.filledCount}
            </span>
          )}
          {stats.notesCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
              📝 Notes: {stats.notesCount}
            </span>
          )}
          <button
            type="button"
            onClick={() => void persistChart()}
            disabled={!isDirty || isSaving}
            className="px-2.5 py-1 rounded-lg bg-sky-700 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1 border border-sky-500 transition-colors cursor-pointer"
            title="Save chart changes"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : saveMessage || 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetAllTeeth}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            title="Reset all 32 teeth to natural sound"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* COLOR SCHEME PALETTE & FAST ASSIGN TOOLBAR                           */}
      {/* ===================================================================== */}
      <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Palette Swatches */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Brush className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Select Active Color / Condition Brush:
              </span>
              <span className="text-xs font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                Active: {selectedScheme.name}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COLOR_SCHEMES.map((scheme) => {
                const isActive = selectedScheme.id === scheme.id;
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => setSelectedScheme(scheme)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      isActive
                        ? 'ring-2 ring-sky-500 bg-white shadow-xs border-sky-400 scale-105'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-400/50 shrink-0 shadow-2xs"
                      style={{ backgroundColor: scheme.color }}
                    />
                    <span>{scheme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Brush Application Mode */}
          <div className="shrink-0 bg-white p-2 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              2. Click Mode:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setPaintMode('segment')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  paintMode === 'segment'
                    ? 'bg-white text-sky-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Click any individual segment among the 5 surfaces"
              >
                Single Surface (5 Parts)
              </button>
              <button
                type="button"
                onClick={() => setPaintMode('entire_tooth')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  paintMode === 'entire_tooth'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Click tooth to color all 5 surfaces at once"
              >
                Entire Tooth (All 5)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4 QUADRANTS CHART DISPLAY                                             */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* UPPER ARCH (MAXILLARY) */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Maxillary Arch (Upper Teeth #1 to #16)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Patient Right → Midline → Patient Left
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* QUADRANT 1 (UR): Teeth 1 to 8 */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Quadrant 1: Upper Right (UR)
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Teeth #1 – #8</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkQuadrantHealthy(quadrant1Teeth)}
                  className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                >
                  Mark Q1 Healthy
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {quadrant1Teeth.map((num) => renderToothCircle(num))}
              </div>
            </div>

            {/* QUADRANT 2 (UL): Teeth 9 to 16 */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Quadrant 2: Upper Left (UL)
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Teeth #9 – #16</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkQuadrantHealthy(quadrant2Teeth)}
                  className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                >
                  Mark Q2 Healthy
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {quadrant2Teeth.map((num) => renderToothCircle(num))}
              </div>
            </div>
          </div>
        </div>

        {/* MIDLINE VISUAL DIVIDER */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-slate-300" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-4 py-0.5 text-slate-500 font-bold uppercase tracking-widest text-[10px] rounded-full border border-slate-200 shadow-2xs">
              MIDLINE OCCLUSAL PLANE
            </span>
          </div>
        </div>

        {/* LOWER ARCH (MANDIBULAR) */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Mandibular Arch (Lower Teeth #17 to #32)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Patient Right → Midline → Patient Left
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* QUADRANT 4 (LR): Teeth 32 to 25 */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Quadrant 4: Lower Right (LR)
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Teeth #25 – #32</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkQuadrantHealthy(quadrant4Teeth)}
                  className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                >
                  Mark Q4 Healthy
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {quadrant4Teeth.map((num) => renderToothCircle(num))}
              </div>
            </div>

            {/* QUADRANT 3 (LL): Teeth 24 to 17 */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Quadrant 3: Lower Left (LL)
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Teeth #17 – #24</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkQuadrantHealthy(quadrant3Teeth)}
                  className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                >
                  Mark Q3 Healthy
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {quadrant3Teeth.map((num) => renderToothCircle(num))}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CLINICAL TOOTH NOTES & DETAIL INSPECTOR                                */}
        {/* ===================================================================== */}
        {selectedToothNum && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 rounded-xl border border-sky-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  #{selectedToothNum}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{selectedToothInfo?.name}</span>
                    <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                      {selectedToothInfo?.quadName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    5-Surface Odontogram Analysis · Universal Numbering #{selectedToothNum}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Quick Apply:</span>
                {COLOR_SCHEMES.slice(0, 5).map((scheme) => (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => handleColorEntireTooth(selectedToothNum, scheme)}
                    className="px-2 py-1 rounded text-xs font-bold border transition-colors cursor-pointer"
                    style={{
                      backgroundColor: `${scheme.color}15`,
                      color: scheme.color,
                      borderColor: `${scheme.color}40`,
                    }}
                    title={`Color all 5 surfaces of Tooth #${selectedToothNum} with ${scheme.name}`}
                  >
                    {scheme.name.split('/')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Input Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileEdit className="w-3.5 h-3.5 text-sky-600" />
                  <span>Clinical Tooth Notes for #{selectedToothNum}</span>
                </label>
                {noteSaveMessage && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" /> Note saved!
                  </span>
                )}
              </div>

              <textarea
                value={editingNote}
                onChange={(e) => setEditingNote(e.target.value)}
                placeholder={`Type clinical diagnosis, restorative findings, or instructions for Tooth #${selectedToothNum}...`}
                rows={2}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />

              {/* Quick Presets */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Preset Findings:
                </span>
                {QUICK_NOTE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetNote(preset)}
                    className="text-[10px] bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-md px-2 py-1 font-medium transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Tooth #{selectedToothNum} Notes</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { ToothCondition, ToothData, ToothNumber, ToothSurface } from '../types';
import { CONDITION_CONFIGS, TOOTH_METADATA } from '../data/toothMetadata';

interface ToothVisualProps {
  toothNumber: ToothNumber;
  data: ToothData;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  highlightDifference?: 'worsened' | 'improved' | 'new_issue' | 'treated' | null;
}

export const ToothVisual: React.FC<ToothVisualProps> = ({
  toothNumber,
  data,
  isSelected = false,
  onClick,
  size = 'md',
  showLabel = true,
  highlightDifference = null,
}) => {
  const meta = TOOTH_METADATA[toothNumber];
  const config = CONDITION_CONFIGS[data.condition] || CONDITION_CONFIGS.healthy;
  const isUpper = meta.arch === 'upper';

  const width = size === 'sm' ? 44 : size === 'lg' ? 68 : 54;
  const height = size === 'sm' ? 64 : size === 'lg' ? 96 : 78;

  const isMolar = meta.type === 'molar';
  const isPremolar = meta.type === 'premolar';
  const isAnterior = meta.type === 'incisor' || meta.type === 'canine';

  // Surface check
  const hasSurface = (surface: ToothSurface) => data.surfaces?.includes(surface);

  // Styling based on difference highlight if comparing
  let differenceBorder = '';
  if (highlightDifference === 'treated' || highlightDifference === 'improved') {
    differenceBorder = 'ring-2 ring-emerald-500 ring-offset-1';
  } else if (highlightDifference === 'new_issue' || highlightDifference === 'worsened') {
    differenceBorder = 'ring-2 ring-rose-500 ring-offset-1 animate-pulse';
  }

  return (
    <div
      onClick={onClick}
      id={`tooth-item-${toothNumber}`}
      className={`group relative flex flex-col items-center cursor-pointer transition-all duration-150 select-none p-1 rounded-lg ${
        isSelected ? 'bg-sky-100 ring-2 ring-sky-600 shadow-sm' : 'hover:bg-slate-100'
      } ${differenceBorder}`}
      title={`#${toothNumber} - ${meta.name} (${config.label})`}
    >
      {/* Top Tooth Number */}
      {showLabel && isUpper && (
        <span className="text-[11px] font-semibold text-slate-700 mb-0.5 tracking-tight">
          #{toothNumber}
        </span>
      )}

      {/* SVG Tooth Representation */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 60 90"
        className="overflow-visible filter drop-shadow-xs"
      >
        <defs>
          <radialGradient id={`grad-${toothNumber}`} cx="45%" cy="40%" r="65%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="60%" stop-color={config.chartFill} />
            <stop offset="100%" stop-color={config.chartStroke} stop-opacity="0.3" />
          </radialGradient>
        </defs>

        {/* Missing tooth display */}
        {data.condition === 'missing' ? (
          <g>
            <rect
              x="10"
              y="10"
              width="40"
              height="70"
              rx="8"
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <line x1="16" y1="16" x2="44" y2="74" stroke="#94a3b8" strokeWidth="2" />
            <line x1="44" y1="16" x2="16" y2="74" stroke="#94a3b8" strokeWidth="2" />
            <text x="30" y="50" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">
              MISSING
            </text>
          </g>
        ) : (
          <g transform={isUpper ? '' : 'rotate(180 30 45)'}>
            {/* Roots (Top if upper arch, bottom if lower arch) */}
            {isMolar ? (
              // Multi-root for molars
              <g fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2">
                {/* Left root */}
                <path d="M 17 40 C 14 25, 12 10, 20 6 C 24 10, 25 25, 27 40 Z" fill={config.chartFill} />
                {/* Middle root */}
                <path d="M 27 40 C 28 22, 29 12, 31 8 C 33 12, 34 22, 35 40 Z" fill={config.chartFill} />
                {/* Right root */}
                <path d="M 35 40 C 37 25, 38 10, 42 6 C 48 10, 47 25, 44 40 Z" fill={config.chartFill} />
              </g>
            ) : isPremolar ? (
              // Double/single tapered root for premolar
              <g fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2">
                <path d="M 20 40 C 18 25, 22 10, 26 8 C 30 10, 31 25, 31 40 Z" fill={config.chartFill} />
                <path d="M 31 40 C 31 25, 33 10, 36 8 C 40 10, 43 25, 41 40 Z" fill={config.chartFill} />
              </g>
            ) : (
              // Single long conical root for canines/incisors
              <path
                d="M 20 40 C 20 22, 26 8, 30 6 C 34 8, 40 22, 40 40 Z"
                fill={config.chartFill}
                stroke="#94a3b8"
                strokeWidth="1.2"
              />
            )}

            {/* Implant fixture screw visualization */}
            {data.condition === 'implant' && (
              <g fill="#0d9488" stroke="#115e59" strokeWidth="1">
                <rect x="24" y="10" width="12" height="30" rx="2" fill="#14b8a6" />
                <line x1="22" y1="16" x2="38" y2="16" stroke="#0f766e" strokeWidth="1.5" />
                <line x1="22" y1="22" x2="38" y2="22" stroke="#0f766e" strokeWidth="1.5" />
                <line x1="22" y1="28" x2="38" y2="28" stroke="#0f766e" strokeWidth="1.5" />
                <line x1="22" y1="34" x2="38" y2="34" stroke="#0f766e" strokeWidth="1.5" />
              </g>
            )}

            {/* Root canal gutta-percha lines */}
            {data.condition === 'root_canal' && (
              <path
                d="M 30 10 L 30 42"
                stroke="#a855f7"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )}

            {/* Crown Base Outline */}
            <path
              d={
                isMolar
                  ? 'M 13 40 C 11 50, 10 70, 14 80 C 20 84, 40 84, 46 80 C 50 70, 49 50, 47 40 C 40 38, 20 38, 13 40 Z'
                  : isPremolar
                  ? 'M 16 40 C 14 50, 14 70, 17 80 C 22 84, 38 84, 43 80 C 46 70, 46 50, 44 40 C 38 38, 22 38, 16 40 Z'
                  : 'M 18 40 C 16 52, 17 72, 20 81 C 24 84, 36 84, 40 81 C 43 72, 44 52, 42 40 C 36 38, 24 38, 18 40 Z'
              }
              fill={`url(#grad-${toothNumber})`}
              stroke={config.chartStroke}
              strokeWidth="2"
            />

            {/* Tooth Specific Surface Restorations / Pathology Overlays */}
            {/* Occlusal / Incisal center region */}
            <g>
              {isAnterior ? (
                // Incisal edge
                <path
                  d="M 22 76 L 38 76"
                  stroke={
                    data.condition === 'weared_dentin'
                      ? '#ea580c'
                      : data.condition === 'large_cavity'
                      ? '#e11d48'
                      : data.condition === 'moderate_cavity'
                      ? '#f59e0b'
                      : data.condition === 'small_cavity'
                      ? '#ca8a04'
                      : hasSurface('incisal') || hasSurface('occlusal')
                      ? '#2563eb'
                      : '#94a3b8'
                  }
                  strokeWidth={data.condition === 'weared_dentin' ? '4' : '2'}
                  strokeLinecap="round"
                />
              ) : (
                // Occlusal table for molars / premolars
                <rect
                  x="22"
                  y="52"
                  width="16"
                  height="16"
                  rx="3"
                  fill={
                    data.condition === 'rotted'
                      ? '#4c0519'
                      : data.condition === 'large_cavity'
                      ? '#e11d48'
                      : data.condition === 'moderate_cavity'
                      ? '#f59e0b'
                      : data.condition === 'small_cavity'
                      ? '#ca8a04'
                      : data.condition === 'weared_dentin'
                      ? '#ea580c'
                      : data.condition === 'crown'
                      ? '#d97706'
                      : hasSurface('occlusal')
                      ? '#3b82f6'
                      : '#ffffff'
                  }
                  stroke={config.chartStroke}
                  strokeWidth="1"
                  opacity={hasSurface('occlusal') || config.category !== 'normal' ? 0.95 : 0.6}
                />
              )}

              {/* Surface indicator markings */}
              {hasSurface('mesial') && (
                <rect x="14" y="52" width="6" height="16" rx="2" fill="#3b82f6" opacity="0.85" />
              )}
              {hasSurface('distal') && (
                <rect x="40" y="52" width="6" height="16" rx="2" fill="#3b82f6" opacity="0.85" />
              )}
              {hasSurface('buccal') && (
                <rect x="22" y="72" width="16" height="6" rx="2" fill="#3b82f6" opacity="0.85" />
              )}
              {hasSurface('lingual') && (
                <rect x="22" y="42" width="16" height="6" rx="2" fill="#3b82f6" opacity="0.85" />
              )}

              {/* Tartar calculus indicator on cervical margin */}
              {data.condition === 'calculus_tartar' && (
                <path
                  d="M 16 42 Q 30 46 44 42"
                  stroke="#84cc16"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )}

              {/* Weared Down Dentin Exposure (Yellowish-orange pit) */}
              {data.condition === 'weared_dentin' && (
                <ellipse cx="30" cy="60" rx="7" ry="5" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
              )}

              {/* Crown gold/ceramic band indicator */}
              {data.condition === 'crown' && (
                <path
                  d="M 15 44 L 45 44 L 42 78 L 18 78 Z"
                  fill="#fbbf24"
                  fillOpacity="0.4"
                  stroke="#d97706"
                  strokeWidth="1.5"
                />
              )}

              {/* Veneer front cosmetic cap */}
              {data.condition === 'veneer' && (
                <path
                  d="M 20 44 Q 30 40 40 44 L 38 78 Q 30 82 22 78 Z"
                  fill="#f472b6"
                  fillOpacity="0.35"
                  stroke="#db2777"
                  strokeWidth="1.5"
                />
              )}
            </g>
          </g>
        )}
      </svg>

      {/* Bottom Tooth Number */}
      {showLabel && !isUpper && (
        <span className="text-[11px] font-semibold text-slate-700 mt-0.5 tracking-tight">
          #{toothNumber}
        </span>
      )}

      {/* Condition Mini Badge */}
      <span
        className={`mt-0.5 px-1 py-0.2 text-[9px] font-medium rounded truncate max-w-[58px] text-center leading-tight ${config.badgeBg} ${config.badgeText}`}
      >
        {data.condition === 'healthy'
          ? 'Sound'
          : data.condition === 'weared_dentin'
          ? 'Wear'
          : data.condition === 'growing_impacted'
          ? 'Impact'
          : data.condition.replace('_cavity', ' Cav').replace('_', ' ')}
      </span>
    </div>
  );
};

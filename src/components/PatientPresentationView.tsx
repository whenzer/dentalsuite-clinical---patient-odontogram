import React, { useState } from 'react';
import { Customer, ToothData, ToothNumber } from '../types';
import { CONDITION_CONFIGS, TOOTH_METADATA } from '../data/toothMetadata';
import { ToothVisual } from './ToothVisual';
import {
  Presentation,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Heart,
  ArrowRight,
  X,
} from 'lucide-react';

interface PatientPresentationViewProps {
  customer: Customer;
  onClose: () => void;
}

export const PatientPresentationView: React.FC<PatientPresentationViewProps> = ({
  customer,
  onClose,
}) => {
  const chart = customer.teethChart;
  const [selectedFocusTooth, setSelectedFocusTooth] = useState<ToothNumber | null>(19);

  // Group customer teeth by status for patient-friendly overview
  const healthyTeeth: ToothNumber[] = [];
  const restoredTeeth: ToothNumber[] = [];
  const attentionTeeth: ToothNumber[] = [];

  (Object.values(chart) as ToothData[]).forEach((t) => {
    if (t.condition === 'healthy') {
      healthyTeeth.push(t.number);
    } else if (['filling', 'crown', 'root_canal', 'implant', 'veneer'].includes(t.condition)) {
      restoredTeeth.push(t.number);
    } else {
      attentionTeeth.push(t.number);
    }
  });

  const focusToothData = selectedFocusTooth ? chart[selectedFocusTooth] : null;
  const focusToothMeta = selectedFocusTooth ? TOOTH_METADATA[selectedFocusTooth] : null;
  const focusConditionConfig = focusToothData ? CONDITION_CONFIGS[focusToothData.condition] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in">
      <div
        id="patient-presentation-view-container"
        className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
      >
        {/* Presentation Header */}
        <div className="bg-linear-to-r from-sky-700 via-sky-800 to-indigo-900 text-white p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Presentation className="w-7 h-7 text-sky-200" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-400/20 text-sky-200 border border-sky-300/30">
                Patient Consultation & Visual Education Mode
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
                Your Dental Health & Smile Overview
              </h1>
              <p className="text-sm text-sky-100/80 mt-0.5">
                Prepared for <span className="font-bold text-white">{customer.firstName} {customer.lastName}</span> • Clear visual guide to your teeth and treatment plan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>Return to Clinic View</span>
          </button>
        </div>

        {/* Patient Health Summary Badges */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black text-emerald-800 leading-tight">
                {healthyTeeth.length} Sound Teeth
              </p>
              <p className="text-xs text-slate-500 font-medium">Naturally healthy, strong enamel</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black text-blue-800 leading-tight">
                {restoredTeeth.length} Restored Teeth
              </p>
              <p className="text-xs text-slate-500 font-medium">Protected by fillings, crowns, or veneers</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black text-amber-800 leading-tight">
                {attentionTeeth.length} Teeth for Care
              </p>
              <p className="text-xs text-slate-500 font-medium">Requires treatment or preventive care</p>
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Customer Teeth Requiring Care */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Areas We Discussed Today in Your Examination</span>
            </h2>

            {attentionTeeth.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
                <p className="font-bold text-base">Outstanding oral hygiene!</p>
                <p className="text-xs mt-1">All your teeth are currently sound and properly maintained.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attentionTeeth.map((tNum) => {
                  const tData = chart[tNum];
                  const tMeta = TOOTH_METADATA[tNum];
                  const tConf = CONDITION_CONFIGS[tData.condition];
                  const isFocused = selectedFocusTooth === tNum;

                  return (
                    <div
                      key={tNum}
                      onClick={() => setSelectedFocusTooth(tNum)}
                      className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                        isFocused
                          ? 'bg-sky-50/80 border-sky-400 shadow-md ring-2 ring-sky-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
                            Tooth #{tNum}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${tConf.badgeBg} ${tConf.badgeText}`}>
                            {tConf.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">{tMeta.name}</h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {tConf.patientExplanation}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-700">
                        <span>Click for detailed visual</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Visual Explanation Guides (Weared Down Dentin vs Cavities) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            {/* Visual Guide A: Weared Down Dentin (Attrition & Night Grinding) */}
            <div className="bg-orange-50/70 border border-orange-200 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-200 text-orange-900">
                  Visual Guide 1
                </span>
                <h3 className="font-extrabold text-orange-950 text-base">
                  What is "Weared Down Dentin"?
                </h3>
              </div>

              {/* Graphic Diagram */}
              <div className="bg-white rounded-2xl p-4 border border-orange-200 mb-4 flex items-center justify-center">
                <svg viewBox="0 0 320 160" className="w-full max-w-xs h-auto">
                  {/* Left: Healthy tooth with thick enamel */}
                  <g transform="translate(10, 10)">
                    <rect x="0" y="40" width="130" height="90" rx="20" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
                    {/* Inner pulp */}
                    <path d="M 50 60 Q 65 90 80 60" fill="#f43f5e" />
                    {/* Enamel layer label */}
                    <text x="65" y="30" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">Healthy Tooth</text>
                    <text x="65" y="115" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold">Thick Enamel</text>
                  </g>

                  {/* Right: Weared tooth showing exposed yellow dentin */}
                  <g transform="translate(170, 10)">
                    <rect x="0" y="48" width="130" height="82" rx="15" fill="#f8fafc" stroke="#ea580c" strokeWidth="2" />
                    {/* Flat ground chewing surface */}
                    <line x1="15" y1="48" x2="115" y2="48" stroke="#ea580c" strokeWidth="4" />
                    {/* Exposed Dentin (Yellow patch) */}
                    <ellipse cx="65" cy="56" rx="35" ry="12" fill="#f97316" stroke="#c2410c" strokeWidth="1.5" />
                    <text x="65" y="30" textAnchor="middle" fill="#9a3412" fontSize="11" fontWeight="bold">Weared Dentin</text>
                    <text x="65" y="60" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">EXPOSED DENTIN</text>
                    <text x="65" y="115" textAnchor="middle" fill="#ea580c" fontSize="10" fontWeight="bold">Sensitive to cold/acid</text>
                  </g>
                </svg>
              </div>

              <div className="space-y-2 text-xs text-orange-900 leading-relaxed">
                <p>
                  <strong>Why it happens:</strong> Teeth clenching or grinding while sleeping exerts hundreds of pounds of pressure, literally scraping away the outer crystalline white enamel.
                </p>
                <p>
                  <strong>How we protect it:</strong> A custom-fitted occlusal night guard absorbs the friction so your natural teeth never wear down further.
                </p>
              </div>
            </div>

            {/* Visual Guide B: Understanding Cavity Sizes (Small vs Moderate vs Large vs Rotted) */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-200 text-rose-900">
                  Visual Guide 2
                </span>
                <h3 className="font-extrabold text-rose-950 text-base">
                  How Cavities Progress Over Time
                </h3>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-rose-200 mb-4">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* Stage 1 */}
                  <div className="p-2 rounded-xl bg-yellow-50 border border-yellow-200">
                    <div className="w-8 h-8 rounded-full bg-yellow-200 mx-auto flex items-center justify-center font-bold text-yellow-800 mb-1">
                      1
                    </div>
                    <p className="font-bold text-[11px] text-yellow-900">Small Cavity</p>
                    <p className="text-[10px] text-yellow-700 mt-1">Outer enamel only. Fast, easy filling or seal.</p>
                  </div>

                  {/* Stage 2 */}
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="w-8 h-8 rounded-full bg-amber-200 mx-auto flex items-center justify-center font-bold text-amber-800 mb-1">
                      2
                    </div>
                    <p className="font-bold text-[11px] text-amber-900">Moderate</p>
                    <p className="text-[10px] text-amber-700 mt-1">Enters softer dentin layer.</p>
                  </div>

                  {/* Stage 3 */}
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="w-8 h-8 rounded-full bg-rose-200 mx-auto flex items-center justify-center font-bold text-rose-800 mb-1">
                      3
                    </div>
                    <p className="font-bold text-[11px] text-rose-900">Large Cavity</p>
                    <p className="text-[10px] text-rose-700 mt-1">Close to nerve. Sensitivity or ache.</p>
                  </div>

                  {/* Stage 4 */}
                  <div className="p-2 rounded-xl bg-rose-900 text-white">
                    <div className="w-8 h-8 rounded-full bg-rose-700 mx-auto flex items-center justify-center font-bold text-white mb-1">
                      4
                    </div>
                    <p className="font-bold text-[11px] text-rose-100">Rotted / Deep</p>
                    <p className="text-[10px] text-rose-200 mt-1">Infected pulp nerve. Root canal needed.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-rose-900 leading-relaxed">
                <p>
                  <strong>Catching it early matters:</strong> Treating cavities in Stage 1 or 2 saves more than 80% of your natural tooth and keeps treatment simple, painless, and economical.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Presentation Footer */}
        <div className="p-6 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Questions? Our dental team is here to walk you through every step.</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-colors"
          >
            Finished Consultation
          </button>
        </div>
      </div>
    </div>
  );
};

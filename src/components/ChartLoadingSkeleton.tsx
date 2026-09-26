import React from 'react';

const teeth = Array.from({ length: 32 }, (_, index) => index + 1);

export const ChartLoadingSkeleton: React.FC = () => (
  <div className="space-y-5 animate-pulse" aria-label="Loading dental chart" role="status">
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-44 rounded bg-slate-200" />
        <div className="h-3 w-64 rounded bg-slate-100" />
      </div>
      <div className="h-8 w-24 rounded-lg bg-slate-100" />
    </div>

    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-7 w-28 rounded-lg bg-slate-100" />
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {teeth.map((tooth) => (
          <div key={tooth} className="aspect-square rounded-xl border border-slate-200 bg-slate-100" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="h-10 rounded-lg bg-slate-100" />
        <div className="h-10 rounded-lg bg-slate-100" />
        <div className="h-10 rounded-lg bg-slate-100" />
        <div className="h-10 rounded-lg bg-slate-100" />
      </div>
    </div>
  </div>
);
import React from 'react';

export default function SuggestionSkeleton() {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800/80 bg-slate-900/10 flex flex-col justify-between space-y-5 animate-pulse shadow-md">
      <div className="space-y-4">
        {/* Header Shimmer */}
        <div className="flex justify-between items-center">
          <div className="h-5 w-16 bg-slate-800 rounded-full"></div>
          <div className="h-6 w-6 bg-slate-800 rounded-full"></div>
        </div>

        {/* Title Shimmer */}
        <div className="space-y-2">
          <div className="h-4 w-5/6 bg-slate-800 rounded"></div>
          <div className="h-4 w-2/3 bg-slate-800 rounded"></div>
        </div>

        {/* Description Shimmer */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-800/60 rounded"></div>
          <div className="h-3 w-11/12 bg-slate-800/60 rounded"></div>
          <div className="h-3 w-4/5 bg-slate-800/60 rounded"></div>
        </div>
      </div>

      {/* Savings Badge Shimmer */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 flex justify-between items-center">
        <div className="h-3 w-1/3 bg-slate-800 rounded"></div>
        <div className="h-3 w-1/4 bg-slate-800 rounded"></div>
      </div>
    </div>
  );
}

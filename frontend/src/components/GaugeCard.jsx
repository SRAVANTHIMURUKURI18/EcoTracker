import React from 'react';

export default function GaugeCard({ todayTotal = 0, budget = 8.0 }) {
  const remaining = budget - todayTotal;
  const percentage = Math.min((todayTotal / budget) * 100, 100);

  // SVG circular properties
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Gauge Color Selector
  let gaugeColor = 'stroke-accentGreen';
  let textColor = 'text-accentGreen';
  if (todayTotal > budget) {
    gaugeColor = 'stroke-accentRed';
    textColor = 'text-accentRed';
  } else if (todayTotal > budget * 0.75) {
    gaugeColor = 'stroke-accentAmber';
    textColor = 'text-accentAmber';
  }

  return (
    <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg border border-slate-800/80">
      <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">
        Carbon Budget Meter
      </h3>
      
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-slate-800/60 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Foreground Animated Gauge Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            className={`fill-none gauge-path ${gaugeColor}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Central Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Today's CO₂</span>
          <span className={`text-4xl font-black tracking-tight ${textColor} my-0.5`}>
            {todayTotal.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 font-semibold">kg / {budget} kg</span>
        </div>
      </div>

      <div className="mt-6 space-y-1.5">
        {remaining >= 0 ? (
          <p className="text-sm text-slate-200">
            You have <span className="text-accentGreen font-bold">{remaining.toFixed(1)} kg</span> remaining in your budget.
          </p>
        ) : (
          <p className="text-sm text-slate-200">
            You exceeded budget by <span className="text-accentRed font-bold">{Math.abs(remaining).toFixed(1)} kg</span> today.
          </p>
        )}
        <p className="text-[10px] text-slate-500">Target limit is configured at {budget} kg</p>
      </div>
    </div>
  );
}

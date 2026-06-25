import React from 'react';

export default function SuggestionCard({ suggestion }) {
  const getCategoryTheme = (category) => {
    switch (category?.toLowerCase()) {
      case 'travel':
        return {
          border: 'border-blue-500/20 hover:border-blue-500/60',
          bg: 'bg-blue-950/10',
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: '🚗',
          titleColor: 'text-blue-300'
        };
      case 'food':
        return {
          border: 'border-green-500/20 hover:border-green-500/60',
          bg: 'bg-green-950/10',
          badge: 'bg-green-500/10 text-green-400 border-green-500/20',
          icon: '🥗',
          titleColor: 'text-green-300'
        };
      case 'energy':
        return {
          border: 'border-amber-500/20 hover:border-amber-500/60',
          bg: 'bg-amber-950/10',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: '⚡',
          titleColor: 'text-amber-300'
        };
      default:
        return {
          border: 'border-slate-800 hover:border-slate-700',
          bg: 'bg-slate-900/50',
          badge: 'bg-slate-800 text-slate-400 border-slate-750',
          icon: '💡',
          titleColor: 'text-slate-200'
        };
    }
  };

  const theme = getCategoryTheme(suggestion.category);

  return (
    <div
      className={`glass-card p-6 rounded-2xl border ${theme.border} ${theme.bg} transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1.5 shadow-md`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.badge}`}>
            {suggestion.category}
          </span>
          <span className="text-2xl">{theme.icon}</span>
        </div>

        <h3 className={`text-lg font-bold leading-tight ${theme.titleColor}`}>
          {suggestion.title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          {suggestion.description}
        </p>
      </div>

      {/* CO2 Savings Footnote */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/60 flex justify-between items-center text-xs">
        <span className="text-slate-500 font-semibold uppercase tracking-wider">Daily Saving</span>
        <span className="font-extrabold text-accentGreen">
          -{parseFloat(suggestion.estimated_co2_saving).toFixed(1)} kg CO₂ / day
        </span>
      </div>
    </div>
  );
}

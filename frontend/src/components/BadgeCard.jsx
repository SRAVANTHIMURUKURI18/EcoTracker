import React from 'react';

export default function BadgeCard({ badge, isUnlocked, unlockedAt, currentStreak = 0, totalLogs = 0 }) {
  // Determine progress metrics for badges
  let showProgress = false;
  let progressCurrent = 0;
  let progressMax = 1;
  let progressLabel = '';

  if (badge.id === 'streak_3') {
    showProgress = true;
    progressCurrent = Math.min(currentStreak, 3);
    progressMax = 3;
    progressLabel = `${progressCurrent}/3 consecutive days`;
  } else if (badge.id === 'week_warrior') {
    showProgress = true;
    progressCurrent = Math.min(currentStreak, 7);
    progressMax = 7;
    progressLabel = `${progressCurrent}/7 consecutive days`;
  } else if (badge.id === 'monthly_hero') {
    showProgress = true;
    progressCurrent = Math.min(totalLogs, 15);
    progressMax = 15;
    progressLabel = `${progressCurrent}/15 logged days`;
  } else if (badge.id === 'monthly_master') {
    showProgress = true;
    progressCurrent = Math.min(totalLogs, 30);
    progressMax = 30;
    progressLabel = `${progressCurrent}/30 logged days`;
  }

  const progressPercent = Math.min((progressCurrent / progressMax) * 100, 100);

  return (
    <div
      className={`glass-card p-6 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-300 relative overflow-hidden ${
        isUnlocked 
          ? 'border-accentGreen/30 shadow-lg shadow-accentGreen/5 hover:border-accentGreen/60' 
          : 'border-slate-800/80 opacity-60 filter grayscale'
      }`}
    >
      {/* Background radial glow if unlocked */}
      {isUnlocked && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-accentGreen/5 rounded-full blur-2xl transform translate-x-8 -translate-y-8 pointer-events-none"></div>
      )}

      <div className="flex gap-4">
        {/* Badge Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
          isUnlocked 
            ? 'bg-accentGreen/10 border border-accentGreen/20 shadow-md shadow-accentGreen/10' 
            : 'bg-slate-900 border border-slate-850'
        }`}>
          {badge.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-base text-slate-100 truncate">{badge.name}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{badge.description}</p>
        </div>
      </div>

      {/* Progress bar tracking for streak / count achievements */}
      {showProgress && !isUnlocked && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-semibold text-slate-500">
            <span>Progress</span>
            <span>{progressLabel}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 border border-slate-800/60 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accentAmber rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="pt-3 border-t border-slate-850/60 flex justify-between items-center text-xs">
        <span className="text-slate-500 font-semibold">Condition</span>
        {isUnlocked ? (
          <span className="text-accentGreen font-bold">
            Unlocked {unlockedAt}
          </span>
        ) : (
          <span className="text-slate-450 italic">
            {badge.condition}
          </span>
        )}
      </div>
    </div>
  );
}

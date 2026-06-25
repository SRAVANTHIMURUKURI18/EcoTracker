import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api';
import { ALL_BADGES } from '../badges';
import BadgeCard from '../components/BadgeCard';
import { Link } from 'react-router-dom';

export default function Achievements() {
  const { getAuthToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [unlockedList, setUnlockedList] = useState([]);
  const [streak, setStreak] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    async function fetchBadgesAndStats() {
      try {
        setLoading(true);
        const token = await getAuthToken();
        if (!token) return;

        // Fetch settings (includes unlocked badges and current streak)
        const settingsRes = await apiService.getSettings(token);
        if (settingsRes.success && settingsRes.settings) {
          setUnlockedList(settingsRes.settings.badges || []);
          setStreak(settingsRes.settings.streak || 0);
        }

        // Fetch history to get total logs count
        const historyRes = await apiService.getHistory(token);
        if (historyRes.success && historyRes.history) {
          setTotalLogs(historyRes.history.length);
        }
      } catch (err) {
        console.error('Error fetching achievements stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBadgesAndStats();
  }, [getAuthToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accentGreen"></div>
      </div>
    );
  }

  const unlockedMap = new Map(unlockedList.map(b => [b.id, b.unlocked_at]));

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="p-6 glass-card rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <span>🏆</span> Achievements & Milestones
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Unlock certifications and rewards by maintaining low-emissions and logging daily.
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300">
          Earned: <span className="text-accentGreen font-bold text-sm">{unlockedList.length}</span> / 10
        </div>
      </div>

      {/* Grid of Badges using BadgeCard widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ALL_BADGES.map((badge) => {
          const isUnlocked = unlockedMap.has(badge.id);
          const unlockedAt = unlockedMap.get(badge.id);

          return (
            <BadgeCard
              badge={badge}
              isUnlocked={isUnlocked}
              unlockedAt={unlockedAt}
              currentStreak={streak}
              totalLogs={totalLogs}
              key={badge.id}
            />
          );
        })}
      </div>

      {/* Goal Call to Action */}
      {unlockedList.length < 10 && (
        <div className="p-6 glass-card rounded-2xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="font-bold text-slate-200 text-sm">Keep up the eco-habits!</h4>
            <p className="text-xs text-slate-450 mt-0.5">Collect the remaining badges by testing transport modes, plant-based diets, and low household electrical draw.</p>
          </div>
          <Link
            to="/logger"
            className="px-5 py-2.5 bg-accentGreen text-darkBg hover:bg-emerald-400 font-bold rounded-xl text-sm transition-all shadow-lg shrink-0 w-full md:w-auto text-center"
          >
            Log Activities
          </Link>
        </div>
      )}

    </div>
  );
}

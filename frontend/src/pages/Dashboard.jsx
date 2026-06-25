import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api';
import { ALL_BADGES } from '../badges';
import GaugeCard from '../components/GaugeCard';

export default function Dashboard() {
  const { getAuthToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(8.0);
  const [streak, setStreak] = useState(0);
  const [todayLog, setTodayLog] = useState(null);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [recentBadges, setRecentBadges] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const token = await getAuthToken();
        if (!token) return;

        // Fetch settings & budget
        const settingsRes = await apiService.getSettings(token);
        if (settingsRes.success) {
          setBudget(settingsRes.settings.budget || 8.0);
          setStreak(settingsRes.settings.streak || 0);
          setUnlockedBadges(settingsRes.settings.badges || []);
        }

        // Fetch today's log
        const todayRes = await apiService.getTodayLog(token);
        if (todayRes.success && todayRes.log) {
          setTodayLog(todayRes.log);
        } else {
          setTodayLog(null);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [getAuthToken]);

  // Compute recent badges
  useEffect(() => {
    if (unlockedBadges.length > 0) {
      const details = unlockedBadges.map(ub => {
        const meta = ALL_BADGES.find(ab => ab.id === ub.id);
        return meta ? { ...meta, unlocked_at: ub.unlocked_at } : null;
      }).filter(b => b !== null);
      
      details.sort((a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at));
      setRecentBadges(details.slice(0, 3));
    }
  }, [unlockedBadges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accentGreen"></div>
      </div>
    );
  }

  const todayTotal = todayLog ? parseFloat(todayLog.total) : 0.0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-8 animate-fadeIn">
      
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 glass-card rounded-2xl border border-slate-800/80">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Your Carbon Tracker</h1>
          <p className="text-sm text-slate-400 mt-1">Make choices that heal the planet, one step at a time.</p>
        </div>
        
        {/* Streak Indicator */}
        <div className="flex items-center gap-3 bg-slate-900/60 px-5 py-3 rounded-2xl border border-slate-800">
          <span className="text-3xl animate-pulse">🔥</span>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Streak</p>
            <p className="text-lg font-black text-accentAmber">{streak} Days Logged</p>
          </div>
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Isolated Gauge Card Widget */}
        <GaugeCard todayTotal={todayTotal} budget={budget} />

        {/* Action Panel / Today's logs */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
          {todayLog ? (
            <div className="glass-card p-6 rounded-3xl flex-1 border border-slate-800/80 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📅</span> Today's Carbon Logs
                </h3>
                <Link to="/logger" className="text-accentGreen hover:underline text-xs font-semibold">
                  Update Habits
                </Link>
              </div>

              {/* Breakdown category mini-cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Travel */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl">
                    🚗
                  </div>
                  <div>
                    <p className="text-xs text-slate-450 font-bold uppercase">Travel</p>
                    <p className="text-lg font-black text-white mt-0.5">
                      {parseFloat(todayLog.travel_emissions).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kg</span>
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[130px] capitalize">
                      {todayLog.travel.mode.replace('_', ' ')}: {todayLog.travel.distance} km
                    </p>
                  </div>
                </div>

                {/* Food */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-xl">
                    🥗
                  </div>
                  <div>
                    <p className="text-xs text-slate-450 font-bold uppercase">Food</p>
                    <p className="text-lg font-black text-white mt-0.5">
                      {parseFloat(todayLog.food_emissions).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kg</span>
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {todayLog.food.diet_type} ({todayLog.food.meal_count} meals)
                    </p>
                  </div>
                </div>

                {/* Energy */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <div>
                    <p className="text-xs text-slate-450 font-bold uppercase">Energy</p>
                    <p className="text-lg font-black text-white mt-0.5">
                      {parseFloat(todayLog.energy_emissions).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kg</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {todayLog.energy.electricity_kwh} kWh logged
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions Call to Action */}
              <div className="bg-gradient-to-r from-accentGreen/10 to-transparent p-5 rounded-2xl border border-accentGreen/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">Need tips to shrink your footprint?</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Let our AI system run personalized suggestions on your daily numbers.</p>
                </div>
                <button
                  onClick={() => navigate('/suggestions', { state: { emissions: todayLog } })}
                  className="px-4 py-2 bg-accentGreen text-darkBg hover:bg-emerald-400 font-bold rounded-xl text-xs transition-colors shrink-0"
                >
                  Generate AI Swaps
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 rounded-3xl flex-1 border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-6">
              <span className="text-5xl animate-bounce">📋</span>
              <div>
                <h3 className="text-xl font-bold text-white">Habits Log Pending</h3>
                <p className="text-sm text-slate-450 mt-2 max-w-sm">
                  You haven't logged your travel, food, and energy habits for today yet. Log now to check your budget and keep your streak!
                </p>
              </div>
              <button
                onClick={() => navigate('/logger')}
                className="px-6 py-3 bg-accentGreen hover:bg-emerald-400 text-darkBg font-bold rounded-xl shadow-lg shadow-accentGreen/10 transition-colors"
              >
                Log Today's Activities
              </button>
            </div>
          )}

          {/* Badges Shelf */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800/80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-250 flex items-center gap-2">
                <span>🏆</span> Recent Achievements
              </h3>
              <Link to="/badges" className="text-accentGreen hover:underline text-xs font-semibold">
                View All Badges
              </Link>
            </div>

            {recentBadges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentBadges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex items-center gap-2"
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-200 truncate">{badge.name}</p>
                      <p className="text-[9px] text-slate-500 truncate">Unlocked {badge.unlocked_at}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center">
                No achievements unlocked yet. Log consistently to earn badges!
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

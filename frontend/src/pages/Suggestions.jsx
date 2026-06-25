import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api';
import SuggestionCard from '../components/SuggestionCard';
import SuggestionSkeleton from '../components/SuggestionSkeleton';

export default function Suggestions() {
  const { getAuthToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [todayLog, setTodayLog] = useState(location.state?.emissions || null);

  useEffect(() => {
    async function loadTodayLogAndSuggestions() {
      try {
        setLoading(true);
        setError('');
        const token = await getAuthToken();
        if (!token) return;

        let log = todayLog;
        if (!log) {
          // Fetch today's log if not passed in state
          const todayRes = await apiService.getTodayLog(token);
          if (todayRes.success && todayRes.log) {
            log = todayRes.log;
            setTodayLog(todayRes.log);
          }
        }

        if (!log) {
          setError('Please record your habits for today first to generate custom AI recommendations.');
          setLoading(false);
          return;
        }

        // Generate suggestions payload
        const payload = {
          travel_emissions: log.travel_emissions,
          food_emissions: log.food_emissions,
          energy_emissions: log.energy_emissions,
          total: log.total,
          breakdown: {
            travel: log.travel,
            food: log.food,
            energy: log.energy
          }
        };

        const suggRes = await apiService.generateSuggestions(payload, token);
        if (suggRes.success && suggRes.suggestions) {
          setSuggestions(suggRes.suggestions);
        } else {
          setError('Failed to generate suggestions. Please try again.');
        }
      } catch (err) {
        console.error('Error generating AI suggestions:', err);
        setError('Error connecting to the recommendation service.');
      } finally {
        setLoading(false);
      }
    }

    loadTodayLogAndSuggestions();
  }, [getAuthToken]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="p-6 glass-card rounded-2xl border border-slate-800/80 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <span>💡</span> AI Lifestyle Swaps
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Personalized eco-friendly suggestions powered by Llama 3.3 model.
          </p>
        </div>
        <Link 
          to="/" 
          className="px-4 py-2 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-350 hover:text-white transition-all font-semibold"
        >
          Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="space-y-6">
          <p className="text-xs text-slate-500 animate-pulse text-center">Contacting Groq AI for custom suggestions...</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Show skeletons while loading */}
            <SuggestionSkeleton />
            <SuggestionSkeleton />
            <SuggestionSkeleton />
          </div>
        </div>
      ) : error ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-800/80 text-center space-y-6 max-w-lg mx-auto">
          <span className="text-5xl block">⚠️</span>
          <h3 className="text-xl font-bold text-white">Recommendations Unavailable</h3>
          <p className="text-sm text-slate-450 leading-relaxed">
            {error}
          </p>
          {!todayLog && (
            <Link
              to="/logger"
              className="inline-block px-6 py-3 bg-accentGreen hover:bg-emerald-400 text-darkBg font-bold rounded-xl transition-all shadow-lg shadow-accentGreen/15"
            >
              Log Today's Habits
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestions.map((sugg, idx) => (
              <SuggestionCard suggestion={sugg} key={idx} />
            ))}
          </div>

          {/* Quick link */}
          <div className="p-6 glass-card rounded-2xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="font-bold text-slate-200 text-sm">Need a flight or utility estimate?</h4>
              <p className="text-xs text-slate-450 mt-0.5">Explore standard parameters and estimate flight/electricity carbon footprints using Carbon Interface APIs.</p>
            </div>
            <div className="flex gap-2">
              <Link 
                to="/profile" 
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Carbon Budget Settings
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

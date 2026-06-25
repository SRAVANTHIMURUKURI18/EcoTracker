import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function History() {
  const { getAuthToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [budget, setBudget] = useState(8.0);
  const [stats, setStats] = useState({
    avg7: 0,
    best: 0,
    worst: 0,
    monthlyTotal: 0
  });

  useEffect(() => {
    async function loadHistoryData() {
      try {
        setLoading(true);
        const token = await getAuthToken();
        if (!token) return;

        // Fetch settings for budget context
        const settingsRes = await apiService.getSettings(token);
        let budgetVal = 8.0;
        if (settingsRes.success) {
          budgetVal = settingsRes.settings.budget || 8.0;
          setBudget(budgetVal);
        }

        // Fetch logs history
        const histRes = await apiService.getHistory(token);
        if (histRes.success && histRes.history) {
          const rawHistory = histRes.history; // chronological order (oldest first)
          setHistory(rawHistory);

          if (rawHistory.length > 0) {
            // Calculations for stat widgets
            const totals = rawHistory.map(h => parseFloat(h.total) || 0.0);
            
            // 7-day average
            const last7 = totals.slice(-7);
            const avg7 = last7.reduce((sum, val) => sum + val, 0) / (last7.length || 1);
            
            // Best day (lowest emissions)
            const best = Math.min(...totals);
            
            // Worst day (highest emissions)
            const worst = Math.max(...totals);
            
            // Monthly total
            const monthlyTotal = totals.reduce((sum, val) => sum + val, 0);

            setStats({
              avg7: parseFloat(avg7.toFixed(2)),
              best: parseFloat(best.toFixed(2)),
              worst: parseFloat(worst.toFixed(2)),
              monthlyTotal: parseFloat(monthlyTotal.toFixed(2))
            });
          }
        }
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHistoryData();
  }, [getAuthToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accentGreen"></div>
      </div>
    );
  }

  // --- Line Chart Configuration (30-day Line Chart) ---
  const lineLabels = history.map(h => {
    const parts = h.date.split('-');
    return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : h.date;
  });

  const lineChartData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Daily Footprint (kg CO₂)',
        data: history.map(h => h.total),
        borderColor: '#0dd38e',
        backgroundColor: 'rgba(13, 211, 142, 0.05)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#0dd38e',
        pointRadius: 4
      },
      {
        label: 'Daily Carbon Budget Limit',
        data: Array(history.length).fill(budget),
        borderColor: '#ef4444',
        borderWidth: 2,
        borderDash: [6, 6],
        pointRadius: 0,
        fill: false
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { weight: 'bold' } }
      },
      tooltip: {
        callbacks: {
          label: (context) => `Emissions: ${context.parsed.y.toFixed(2)} kg CO₂`
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
    }
  };

  // --- Stacked Bar Configuration (14-day Breakdown) ---
  const barSlice = history.slice(-14);
  const barLabels = barSlice.map(h => {
    const parts = h.date.split('-');
    return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : h.date;
  });

  const barChartData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Travel Emissions',
        data: barSlice.map(h => h.travel_emissions),
        backgroundColor: '#3b82f6',
        borderRadius: 4
      },
      {
        label: 'Food Diet Emissions',
        data: barSlice.map(h => h.food_emissions),
        backgroundColor: '#10b981',
        borderRadius: 4
      },
      {
        label: 'Home Energy Emissions',
        data: barSlice.map(h => h.energy_emissions),
        backgroundColor: '#f59e0b',
        borderRadius: 4
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { weight: 'bold' } }
      }
    },
    scales: {
      x: { stacked: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      y: { stacked: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
    }
  };

  // --- Heatmap Configuration (30-day Calendar Grid) ---
  const heatmapDays = [...history].reverse().slice(0, 30).reverse();
  while (heatmapDays.length < 30) {
    heatmapDays.unshift({ date: '', total: null, placeholder: true });
  }

  const getHeatmapColor = (day) => {
    if (day.placeholder || day.total === null) {
      return 'bg-slate-900 border-slate-800/80 text-slate-650';
    }
    const val = parseFloat(day.total);
    if (val <= budget * 0.5) {
      return 'bg-emerald-950/80 border-accentGreen/50 text-accentGreen';
    }
    if (val <= budget) {
      return 'bg-emerald-900/30 border-accentGreen/30 text-emerald-300';
    }
    return 'bg-red-950/50 border-accentRed/40 text-accentRed';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-8 animate-fadeIn">
      
      {/* Page Header */}
      <div className="p-6 glass-card rounded-2xl border border-slate-800/80 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <span>📈</span> Footprint History & Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Analyze patterns and track metrics against targets over the last 30 days.
          </p>
        </div>
        <Link 
          to="/logger"
          className="px-5 py-2.5 bg-accentGreen text-darkBg font-bold hover:bg-emerald-400 rounded-xl text-sm transition-colors shadow-lg shadow-accentGreen/10"
        >
          Add Daily Entry
        </Link>
      </div>

      {/* Summary Stats Row */}
      {history.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">7-Day Average</p>
            <p className="text-2xl font-black text-white mt-1">
              {stats.avg7} <span className="text-xs text-slate-405 font-normal">kg</span>
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl">
            <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Lowest Footprint</p>
            <p className="text-2xl font-black text-accentGreen mt-1">
              {stats.best} <span className="text-xs text-slate-405 font-normal">kg</span>
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl">
            <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Highest Footprint</p>
            <p className="text-2xl font-black text-accentRed mt-1">
              {stats.worst} <span className="text-xs text-slate-405 font-normal">kg</span>
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl">
            <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">30-Day Total</p>
            <p className="text-2xl font-black text-accentBlue mt-1">
              {stats.monthlyTotal} <span className="text-xs text-slate-405 font-normal">kg</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800">
          No records logged yet. Stats summary will populate once you begin logging daily habits.
        </div>
      )}

      {history.length > 0 ? (
        <div className="space-y-8">
          
          {/* Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Line Chart */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <h3 className="text-lg font-bold text-slate-200 mb-4">Carbon Footprint Trend vs Budget</h3>
              <div className="h-72">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>

            {/* Stacked Bar Chart */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <h3 className="text-lg font-bold text-slate-200 mb-4">14-Day Emissions Sources Breakdown</h3>
              <div className="h-72">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
          </div>

          {/* Color-Coded Heatmap Grid */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-200">30-Day Activity Heatmap</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quick calendar view showing daily budget limits performance.</p>
              </div>

              {/* Legends */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800 inline-block"></span>
                  <span className="text-slate-450">Unlogged</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-950 border border-accentGreen/50 inline-block"></span>
                  <span className="text-slate-450">&lt;= 50% Budget</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-900/30 border border-accentGreen/30 inline-block"></span>
                  <span className="text-slate-450">Under Budget</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-red-950/50 border border-accentRed/40 inline-block"></span>
                  <span className="text-slate-450">Over Budget</span>
                </div>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
              {heatmapDays.map((day, idx) => {
                const colorClass = getHeatmapColor(day);
                return (
                  <div
                    key={idx}
                    className={`heatmap-day border p-3 rounded-xl flex flex-col justify-between aspect-square select-none cursor-default ${colorClass}`}
                  >
                    <span className="text-[10px] opacity-60 font-mono font-bold">
                      {day.date ? day.date.split('-').slice(1).join('/') : `Day ${idx + 1}`}
                    </span>
                    <span className="text-xs font-extrabold truncate">
                      {day.total !== null ? `${day.total.toFixed(1)} kg` : '--'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-card p-12 rounded-3xl border border-slate-800/80 text-center flex flex-col items-center justify-center space-y-4">
          <span className="text-5xl">📊</span>
          <h3 className="text-lg font-bold text-white">Analytics Pending Data</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            Once you log several habits, Chart.js will display footprints tracking curves, category compositions, and efficiency heatmaps.
          </p>
          <Link
            to="/logger"
            className="px-6 py-3 bg-accentGreen hover:bg-emerald-400 text-darkBg font-bold rounded-xl transition-colors shadow-lg shadow-accentGreen/15"
          >
            Log First Day
          </Link>
        </div>
      )}

    </div>
  );
}

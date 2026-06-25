import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api';

export default function Profile() {
  const { getAuthToken, currentUser } = useAuth();
  
  // Profile settings state
  const [budget, setBudget] = useState(8.0);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [theme, setTheme] = useState('dark');
  const [country, setCountry] = useState('in');
  const [weeklyGoal, setWeeklyGoal] = useState(10.0);
  
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Carbon Interface Calculator tab state
  const [calcTab, setCalcTab] = useState('electricity');
  
  // Electricity Calculator State
  const [elecForm, setElecForm] = useState({
    value: 10,
    unit: 'kwh',
    country: 'in',
    state: ''
  });
  const [elecResult, setElecResult] = useState(null);
  const [elecLoading, setElecLoading] = useState(false);
  const [elecError, setElecError] = useState('');

  // Flight Calculator State
  const [flightForm, setFlightForm] = useState({
    departure: 'DEL',
    destination: 'BOM',
    passengers: 1
  });
  const [flightResult, setFlightResult] = useState(null);
  const [flightLoading, setFlightLoading] = useState(false);
  const [flightError, setFlightError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const token = await getAuthToken();
        const res = await apiService.getSettings(token);
        if (res.success && res.settings) {
          setBudget(res.settings.budget || 8.0);
          setDisplayName(res.settings.displayName || res.settings.patient_name || currentUser?.displayName || '');
          setTheme(res.settings.theme || 'dark');
          setCountry(res.settings.country || 'in');
          setWeeklyGoal(res.settings.weekly_goal || 10.0);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    }
    loadSettings();
  }, [getAuthToken, currentUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setSaveLoading(true);

    try {
      const token = await getAuthToken();
      const budgetNum = parseFloat(budget);
      if (isNaN(budgetNum) || budgetNum <= 0) {
        throw new Error('Carbon budget must be a positive number');
      }
      const goalNum = parseFloat(weeklyGoal);
      if (isNaN(goalNum) || goalNum < 0) {
        throw new Error('Weekly reduction goal must be a non-negative number');
      }

      const payload = {
        budget: budgetNum,
        displayName: displayName,
        theme: theme,
        country: country,
        weekly_goal: goalNum
      };

      const res = await apiService.updateSettings(payload, token);
      if (res.success) {
        setProfileMsg('Profile configuration updated successfully!');
      } else {
        setProfileErr(res.error || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileErr(err.message || 'An error occurred.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleElectricityCalc = async (e) => {
    e.preventDefault();
    setElecError('');
    setElecResult(null);
    setElecLoading(true);

    try {
      const token = await getAuthToken();
      const payload = {
        electricity_value: parseFloat(elecForm.value),
        electricity_unit: elecForm.unit,
        country: elecForm.country,
        state: elecForm.state || undefined
      };

      const res = await apiService.calculateElectricity(payload, token);
      if (res.success) {
        setElecResult(res);
      } else {
        setElecError('Calculator request failed.');
      }
    } catch (err) {
      setElecError(err.response?.data?.error || err.message || 'Error executing calculation.');
    } finally {
      setElecLoading(false);
    }
  };

  const handleFlightCalc = async (e) => {
    e.preventDefault();
    setFlightError('');
    setFlightResult(null);
    setFlightLoading(true);

    try {
      const token = await getAuthToken();
      
      const payload = {
        passengers: parseInt(flightForm.passengers),
        legs: [
          {
            departure_airport: flightForm.departure.toUpperCase().trim(),
            destination_airport: flightForm.destination.toUpperCase().trim()
          }
        ]
      };

      const res = await apiService.calculateFlight(payload, token);
      if (res.success) {
        setFlightResult(res);
      } else {
        setFlightError('Flight calculator request failed.');
      }
    } catch (err) {
      setFlightError(err.response?.data?.error || err.message || 'Error executing calculation.');
    } finally {
      setFlightLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="p-6 glass-card rounded-2xl border border-slate-800/80">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <span>👤</span> Profile & Carbon Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">Configure profile thresholds and test real-world carbon calculation APIs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Settings Card */}
        <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between shadow-md">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <h3 className="text-lg font-bold text-slate-200 pb-3 border-b border-slate-850">
              User Profile
            </h3>

            {profileMsg && (
              <div className="bg-emerald-950/40 border border-accentGreen/30 text-emerald-300 px-4 py-3 rounded-lg text-xs font-bold">
                {profileMsg}
              </div>
            )}
            {profileErr && (
              <div className="bg-red-950/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs font-bold">
                {profileErr}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Display Name</label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                value={displayName}
                placeholder="Alex Green"
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Daily Carbon Budget (kg CO₂)
              </label>
              <input
                type="number"
                step="any"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Country</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="in">India (IN)</option>
                  <option value="us">United States (US)</option>
                  <option value="ca">Canada (CA)</option>
                  <option value="gb">United Kingdom (GB)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Weekly Goal (%)</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(e.target.value)}
                >
                  <option value="5">5% Reduction</option>
                  <option value="10">10% Reduction</option>
                  <option value="20">20% Reduction</option>
                  <option value="30">30% Reduction</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Theme Selection</label>
              <select
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="dark">Dark Theme (Emerald / Slate)</option>
                <option value="light">Light Theme (Standard Slate)</option>
              </select>
            </div>

            <button
              disabled={saveLoading}
              type="submit"
              className="w-full py-3 bg-accentGreen text-darkBg font-bold rounded-xl text-sm transition-colors shadow-lg shadow-accentGreen/10"
            >
              {saveLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Live Estimator Utilities */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-6 shadow-md">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <h3 className="text-lg font-bold text-slate-200">
                ⚡ Carbon Interface Live Calculator
              </h3>
              <div className="flex gap-1.5 text-xs bg-slate-900/60 p-1 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCalcTab('electricity')}
                  className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
                    calcTab === 'electricity' ? 'bg-accentGreen text-darkBg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Grid Electricity
                </button>
                <button
                  type="button"
                  onClick={() => setCalcTab('flight')}
                  className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
                    calcTab === 'flight' ? 'bg-accentGreen text-darkBg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Passenger Flights
                </button>
              </div>
            </div>

            {/* ELECTRICITY CALCULATOR */}
            {calcTab === 'electricity' && (
              <div className="py-4 space-y-5">
                <p className="text-xs text-slate-400">
                  Calculate electricity carbon emissions using official national grid factors (India Central Electricity Authority CEA or local state profiles).
                </p>

                {elecError && (
                  <div className="bg-red-955/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs font-semibold">
                    {elecError}
                  </div>
                )}

                <form onSubmit={handleElectricityCalc} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Usage Value</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                      value={elecForm.value}
                      onChange={(e) => setElecForm(prev => ({ ...prev, value: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Unit</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                      value={elecForm.unit}
                      onChange={(e) => setElecForm(prev => ({ ...prev, unit: e.target.value }))}
                    >
                      <option value="kwh">Kilowatt-hour (kWh)</option>
                      <option value="mwh">Megawatt-hour (MWh)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Country Code</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                      value={elecForm.country}
                      onChange={(e) => setElecForm(prev => ({ ...prev, country: e.target.value }))}
                    >
                      <option value="in">India (IN)</option>
                      <option value="us">United States (US)</option>
                      <option value="ca">Canada (CA)</option>
                      <option value="gb">United Kingdom (GB)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      disabled={elecLoading}
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-accentGreen to-emerald-600 hover:from-emerald-500 hover:to-accentGreen text-darkBg font-bold rounded-xl text-xs transition-colors shadow-lg disabled:opacity-50"
                    >
                      {elecLoading ? 'Calculating...' : 'Query Grid Emissions'}
                    </button>
                  </div>
                </form>

                {elecResult && (
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-850 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Estimated Grid Footprint</p>
                      <p className="text-[10px] text-slate-505 mt-1">Source type: {elecResult.source.replace('_', ' ')}</p>
                    </div>
                    <p className="text-2xl font-black text-accentGreen">
                      {elecResult.carbon_kg.toFixed(2)} <span className="text-sm font-semibold text-slate-400">kg CO₂</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* FLIGHT CALCULATOR */}
            {calcTab === 'flight' && (
              <div className="py-4 space-y-5">
                <p className="text-xs text-slate-400">
                  Estimate total passenger flight emissions based on departure and destination IATA airport codes (e.g. DEL to BOM).
                </p>

                {flightError && (
                  <div className="bg-red-955/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs font-semibold">
                    {flightError}
                  </div>
                )}

                <form onSubmit={handleFlightCalc} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Departure Airport IATA</label>
                    <input
                      type="text"
                      maxLength="3"
                      placeholder="e.g. DEL"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm uppercase"
                      value={flightForm.departure}
                      onChange={(e) => setFlightForm(prev => ({ ...prev, departure: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Destination Airport IATA</label>
                    <input
                      type="text"
                      maxLength="3"
                      placeholder="e.g. BOM"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm uppercase"
                      value={flightForm.destination}
                      onChange={(e) => setFlightForm(prev => ({ ...prev, destination: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Passengers</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                      value={flightForm.passengers}
                      onChange={(e) => setFlightForm(prev => ({ ...prev, passengers: e.target.value }))}
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      disabled={flightLoading}
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-accentGreen to-emerald-600 hover:from-emerald-500 hover:to-accentGreen text-darkBg font-bold rounded-xl text-xs transition-colors shadow-lg disabled:opacity-50"
                    >
                      {flightLoading ? 'Calculating...' : 'Query Flight Emissions'}
                    </button>
                  </div>
                </form>

                {flightResult && (
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-850 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Estimated Flight Footprint</p>
                      <p className="text-[10px] text-slate-505 mt-1">
                        Leg Distance: {flightResult.distance_km} km | Source: {flightResult.source.replace('_', ' ')}
                      </p>
                    </div>
                    <p className="text-2xl font-black text-accentGreen">
                      {flightResult.carbon_kg.toFixed(2)} <span className="text-sm font-semibold text-slate-400">kg CO₂</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

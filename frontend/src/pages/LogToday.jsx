import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api';
import { evaluateBadges } from '../badges';

// Local coefficients for real-time calculation previews
const TRANSPORT_COEFFICIENTS = {
  car_petrol: 0.192,
  car_diesel: 0.171,
  car_electric: 0.053,
  bus: 0.089,
  train: 0.041,
  motorcycle: 0.114,
  bicycle: 0.000,
  walking: 0.000
};

const FOOD_COEFFICIENTS = {
  'meat-heavy': 7.19,
  omnivore: 5.63,
  vegetarian: 3.81,
  vegan: 2.89
};

const ELECTRICITY_FACTOR = 0.233;
const HEATING_FLAT_RATE = 2.0;
const AC_FLAT_RATE = 1.5;

export default function LogToday() {
  const { getAuthToken } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Badge unlock modal state
  const [newBadges, setNewBadges] = useState([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // Form State
  const [travel, setTravel] = useState({
    mode: 'car_petrol',
    distance: 0,
    passengers: 1
  });

  const [food, setFood] = useState({
    diet_type: 'omnivore',
    meal_count: 3,
    food_waste: false
  });

  const [energy, setEnergy] = useState({
    electricity_kwh: 5.0,
    heating: false,
    ac: false
  });

  // Previews math states
  const [previews, setPreviews] = useState({
    travel: 0,
    food: 5.63,
    energy: 1.165,
    total: 6.795
  });

  // Recalculate previews whenever form inputs change
  useEffect(() => {
    // Travel preview
    const tDist = parseFloat(travel.distance) || 0;
    const tPas = parseInt(travel.passengers) || 1;
    const tCoef = TRANSPORT_COEFFICIENTS[travel.mode] || 0.0;
    const travelEst = (tDist * tCoef) / (tPas < 1 ? 1 : tPas);

    // Food preview
    const fBase = FOOD_COEFFICIENTS[food.diet_type] || 5.63;
    const fMeals = parseInt(food.meal_count) || 3;
    const fWaste = food.food_waste;
    const mealsScale = fMeals / 3.0;
    let foodEst = fBase * mealsScale;
    if (fWaste) foodEst *= 1.1;

    // Energy preview
    const eKwh = parseFloat(energy.electricity_kwh) || 0;
    const eHeat = energy.heating;
    const eAc = energy.ac;
    let energyEst = eKwh * ELECTRICITY_FACTOR;
    if (eHeat) energyEst += HEATING_FLAT_RATE;
    if (eAc) energyEst += AC_FLAT_RATE;

    const totalEst = travelEst + foodEst + energyEst;

    setPreviews({
      travel: travelEst,
      food: foodEst,
      energy: energyEst,
      total: totalEst
    });
  }, [travel, food, energy]);

  // Prepopulate today's logs if they exist
  useEffect(() => {
    async function loadTodayLog() {
      try {
        const token = await getAuthToken();
        const res = await apiService.getTodayLog(token);
        if (res.success && res.log) {
          const log = res.log;
          setTravel({
            mode: log.travel?.mode || 'car_petrol',
            distance: log.travel?.distance || 0,
            passengers: log.travel?.passengers || 1
          });
          setFood({
            diet_type: log.food?.diet_type || 'omnivore',
            meal_count: log.food?.meal_count || 3,
            food_waste: log.food?.food_waste || false
          });
          setEnergy({
            electricity_kwh: log.energy?.electricity_kwh || 5.0,
            heating: log.energy?.heating || false,
            ac: log.energy?.ac || false
          });
        }
      } catch (err) {
        console.error('Error preloading today log', err);
      }
    }
    loadTodayLog();
  }, [getAuthToken]);

  // Form validations for each step
  const validateStep = () => {
    setError('');
    if (step === 1) {
      const dist = parseFloat(travel.distance);
      if (isNaN(dist) || dist < 0) {
        setError('Travel distance must be a positive number');
        return false;
      }
      const pass = parseInt(travel.passengers);
      if (isNaN(pass) || pass < 1) {
        setError('Passenger count must be at least 1');
        return false;
      }
    } else if (step === 2) {
      const meals = parseInt(food.meal_count);
      if (isNaN(meals) || meals < 0 || meals > 10) {
        setError('Meal count must be a number between 0 and 10');
        return false;
      }
      if (!FOOD_COEFFICIENTS[food.diet_type]) {
        setError('Invalid diet type selected');
        return false;
      }
    } else if (step === 3) {
      const kwh = parseFloat(energy.electricity_kwh);
      if (isNaN(kwh) || kwh < 0 || kwh > 30) {
        setError('Electricity usage must be a non-negative number between 0 and 30 kWh');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      setLoading(true);
      setError('');
      const token = await getAuthToken();
      
      const payload = {
        travel,
        food,
        energy,
        date: new Date().toISOString().split('T')[0]
      };

      // 1. Calculate footprint and log habit
      const logRes = await apiService.logHabit(payload, token);
      if (!logRes.success) {
        throw new Error(logRes.error || 'Failed to save log');
      }

      // 2. Fetch history and user settings to evaluate badges
      const [historyRes, settingsRes] = await Promise.all([
        apiService.getHistory(token),
        apiService.getSettings(token)
      ]);

      const history = historyRes.history || [];
      const userSettings = settingsRes.settings || {};
      const budget = userSettings.budget || 8.0;
      const currentStreak = logRes.streak || 0;
      const existingBadges = userSettings.badges || [];

      // 3. Evaluate badges list
      const evaluation = evaluateBadges(
        history, 
        logRes, 
        existingBadges, 
        budget, 
        currentStreak
      );

      // 4. If new badges unlocked, update Firestore & display modal
      if (evaluation.newlyUnlocked.length > 0) {
        await apiService.updateBadges(evaluation.updatedBadges, token);
        setNewBadges(evaluation.newlyUnlocked);
        setShowBadgeModal(true);
      } else {
        // Redirect to dashboard
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while saving logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 animate-fadeIn">
      
      {/* Head Panel */}
      <div className="p-6 glass-card rounded-2xl border border-slate-800/80">
        <h1 className="text-2xl font-black text-white">Log Today's Habits</h1>
        <p className="text-sm text-slate-400 mt-1">Record your travel, eating habits, and energy consumption today.</p>
        
        {/* Progress Bar */}
        <div className="relative mt-6">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 transform -translate-y-1/2 rounded-full"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-accentGreen transform -translate-y-1/2 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          
          <div className="relative flex justify-between">
            {[1, 2, 3].map((num) => (
              <div 
                key={num}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                  num === step 
                    ? 'bg-accentGreen border-accentGreen text-darkBg scale-110 shadow-lg shadow-accentGreen/20' 
                    : num < step 
                    ? 'bg-slate-900 border-accentGreen text-accentGreen' 
                    : 'bg-slate-950 border-slate-800 text-slate-550'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-semibold px-1 mt-2">
            <span className={step >= 1 ? 'text-accentGreen' : ''}>1. Travel</span>
            <span className={step >= 2 ? 'text-accentGreen' : ''}>2. Food Diet</span>
            <span className={step >= 3 ? 'text-accentGreen' : ''}>3. Home Energy</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Step Inputs */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800/80 space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: TRAVEL */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🚗</span> Step 1: Transportation Activity
              </h2>
              
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">Transport Mode</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                  value={travel.mode}
                  onChange={(e) => setTravel(prev => ({ ...prev, mode: e.target.value }))}
                >
                  <option value="car_petrol">Petrol Car</option>
                  <option value="car_diesel">Diesel Car</option>
                  <option value="car_electric">Electric Vehicle (EV)</option>
                  <option value="bus">Public Bus</option>
                  <option value="train">Metro / Local Train</option>
                  <option value="motorcycle">Motorcycle / Scooter</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="walking">Walking / Running</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">Distance Travelled (km)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                    value={travel.distance === 0 ? '' : travel.distance}
                    placeholder="e.g. 15.5"
                    onChange={(e) => setTravel(prev => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">Passengers (for carpooling)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                    value={travel.passengers}
                    onChange={(e) => setTravel(prev => ({ ...prev, passengers: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FOOD */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🥗</span> Step 2: Food Consumption
              </h2>
              
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">Diet Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'meat-heavy', label: 'Meat-heavy', desc: 'Frequent red meat / poultry' },
                    { id: 'omnivore', label: 'Omnivore', desc: 'Moderate meats, dairy & veggies' },
                    { id: 'vegetarian', label: 'Vegetarian', desc: 'No meat, includes milk / eggs' },
                    { id: 'vegan', label: 'Vegan', desc: 'Strict plant-based products only' }
                  ].map((diet) => (
                    <button
                      key={diet.id}
                      type="button"
                      onClick={() => setFood(prev => ({ ...prev, diet_type: diet.id }))}
                      className={`p-4 rounded-xl border text-left transition-all duration-350 ${
                        food.diet_type === diet.id 
                          ? 'border-accentGreen bg-accentGreen/5 text-white' 
                          : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <p className="font-bold text-sm text-slate-200">{diet.label}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{diet.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">Meals Logged today</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen text-sm"
                  value={food.meal_count}
                  onChange={(e) => setFood(prev => ({ ...prev, meal_count: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <input
                  id="food_waste"
                  type="checkbox"
                  className="w-5 h-5 accent-accentGreen rounded bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
                  checked={food.food_waste}
                  onChange={(e) => setFood(prev => ({ ...prev, food_waste: e.target.checked }))}
                />
                <label htmlFor="food_waste" className="text-sm font-semibold text-slate-300 cursor-pointer">
                  Wasted edible food today <span className="text-[10px] text-accentRed">(Adds a 10% penalty)</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: ENERGY */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⚡</span> Step 3: Home Energy Activity
              </h2>
              
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Electricity Consumption (kWh)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accentGreen"
                  value={energy.electricity_kwh}
                  onChange={(e) => setEnergy(prev => ({ ...prev, electricity_kwh: parseFloat(e.target.value) || 0 }))}
                />
                <div className="flex justify-between text-xs text-slate-500 font-mono mt-2">
                  <span>0 kWh</span>
                  <span className="text-accentGreen font-bold text-sm bg-slate-900/50 px-2 py-0.5 border border-slate-800 rounded-md">
                    {energy.electricity_kwh.toFixed(1)} kWh
                  </span>
                  <span>30 kWh</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div 
                  onClick={() => setEnergy(prev => ({ ...prev, heating: !prev.heating }))}
                  className={`p-4 rounded-xl border cursor-pointer select-none transition-all duration-300 ${
                    energy.heating 
                      ? 'border-accentGreen bg-accentGreen/5 text-white' 
                      : 'border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔥</span>
                    <div>
                      <p className="text-sm font-bold text-slate-200">Heating</p>
                      <p className="text-[10px] text-slate-550">Flat rate: +2.0 kg CO₂</p>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setEnergy(prev => ({ ...prev, ac: !prev.ac }))}
                  className={`p-4 rounded-xl border cursor-pointer select-none transition-all duration-300 ${
                    energy.ac 
                      ? 'border-accentGreen bg-accentGreen/5 text-white' 
                      : 'border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">❄️</span>
                    <div>
                      <p className="text-sm font-bold text-slate-200">Air Conditioning</p>
                      <p className="text-[10px] text-slate-550">Flat rate: +1.5 kg CO₂</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between pt-4 border-t border-slate-850">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-350 font-bold rounded-xl hover:bg-slate-850 hover:text-white transition-colors text-sm"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-accentGreen text-darkBg font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-accentGreen/10 text-sm"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSave}
                className="px-6 py-3 bg-gradient-to-r from-accentGreen to-emerald-600 hover:from-emerald-500 hover:to-accentGreen text-darkBg font-black rounded-xl transition-all duration-300 shadow-lg shadow-accentGreen/15 disabled:opacity-50 text-sm"
              >
                {loading ? 'Submitting...' : 'Submit Habit Logs'}
              </button>
            )}
          </div>
        </div>

        {/* Live Running Preview Sidebar panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
            <h3 className="text-sm font-extrabold text-slate-400 pb-3 border-b border-slate-850 uppercase tracking-widest">
              Emissions Preview
            </h3>
            
            <div className="divide-y divide-slate-850 py-4 space-y-4">
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-slate-450 font-semibold">Travel</span>
                <span className="font-bold text-slate-200">
                  {previews.travel.toFixed(2)} kg
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-4">
                <span className="text-slate-455 font-semibold">Food Diet</span>
                <span className="font-bold text-slate-200">
                  {previews.food.toFixed(2)} kg
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-4">
                <span className="text-slate-455 font-semibold">Home Energy</span>
                <span className="font-bold text-slate-200">
                  {previews.energy.toFixed(2)} kg
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/60 flex justify-between items-center mt-2">
              <span className="text-sm font-extrabold text-white">Daily Total</span>
              <span className="text-2xl font-black text-accentGreen">
                {previews.total.toFixed(2)} <span className="text-xs text-slate-400">kg</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Celebration Modal for newly unlocked achievements */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 glass-card rounded-3xl border border-accentGreen/30 shadow-2xl text-center space-y-6 animate-scaleIn">
            <span className="text-6xl animate-bounce inline-block">👑</span>
            <div>
              <h2 className="text-3xl font-black text-white bg-gradient-to-r from-accentGreen to-emerald-400 bg-clip-text text-transparent">
                Milestone Reached!
              </h2>
              <p className="text-sm text-slate-400 mt-1">You just unlocked new carbon efficiency badges:</p>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {newBadges.map((badge) => (
                <div 
                  key={badge.id} 
                  className="bg-slate-900 border border-accentGreen/20 p-4 rounded-2xl flex items-center gap-3 text-left"
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{badge.name}</h4>
                    <p className="text-xs text-slate-500">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowBadgeModal(false);
                navigate('/');
              }}
              className="w-full py-3 bg-accentGreen text-darkBg hover:bg-emerald-400 font-bold rounded-xl shadow-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

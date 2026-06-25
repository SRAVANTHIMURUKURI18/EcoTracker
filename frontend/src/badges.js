// Definitions for all ten badges in EcoTrack
export const ALL_BADGES = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Logged your first habit tracker entry.',
    icon: '🌱',
    condition: 'Log any habit once'
  },
  {
    id: 'green_day',
    name: 'Green Day',
    description: 'Kept daily carbon footprint below your budget.',
    icon: '☀️',
    condition: 'Daily emissions <= Budget'
  },
  {
    id: 'streak_3',
    name: '3-Day Streak',
    description: 'Logged habits for 3 consecutive days.',
    icon: '🔥',
    condition: 'Active logging streak >= 3 days'
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Logged habits for 7 consecutive days.',
    icon: '🛡️',
    condition: 'Active logging streak >= 7 days'
  },
  {
    id: 'pedal_power',
    name: 'Pedal Power',
    description: 'Travelled by walking or cycling today.',
    icon: '🚲',
    condition: 'Walk/Bike distance > 0 km'
  },
  {
    id: 'plant_day',
    name: 'Plant Day',
    description: 'Stuck to a vegan or vegetarian diet today.',
    icon: '🥗',
    condition: 'Vegetarian or Vegan diet'
  },
  {
    id: 'low_energy',
    name: 'Low Energy',
    description: 'Kept home energy emissions under 1.0 kg CO₂.',
    icon: '⚡',
    condition: 'Energy emissions <= 1.0 kg'
  },
  {
    id: 'monthly_hero',
    name: 'Monthly Hero',
    description: 'Logged habit records for 15 days total.',
    icon: '🦸',
    condition: 'Total logged days >= 15'
  },
  {
    id: 'monthly_master',
    name: 'Monthly Master',
    description: 'Logged habit records for 30 days total.',
    icon: '🏆',
    condition: 'Total logged days >= 30'
  },
  {
    id: 'zero_waster',
    name: 'Zero Waster',
    description: 'Logged a day with no food waste.',
    icon: '♻️',
    condition: 'No food waste checked'
  }
];

/**
 * Evaluates all 10 badge conditions.
 * @param {Array} history - Past logs history list.
 * @param {Object} currentLog - The logged day's record.
 * @param {Array} existingBadges - Already unlocked badges [{id, unlocked_at}].
 * @param {number} budget - User's daily carbon budget.
 * @param {number} streak - User's active streak.
 * @returns {Object} { updatedBadges, newlyUnlocked }
 */
export function evaluateBadges(history = [], currentLog = {}, existingBadges = [], budget = 8.0, streak = 0) {
  const unlockedMap = new Map(existingBadges.map(b => [b.id, b.unlocked_at]));
  const newlyUnlocked = [];
  const todayStr = new Date().toISOString().split('T')[0];

  const totalLogs = history.length + 1; // past history + today's new log

  // Extract variables from current log
  const travelMode = currentLog.travel?.mode || '';
  const travelDist = parseFloat(currentLog.travel?.distance || 0);
  const dietType = currentLog.food?.diet_type || '';
  const foodWasted = currentLog.food?.food_waste || false;
  const energyEmissions = parseFloat(currentLog.energy_emissions || 0);
  const totalEmissions = parseFloat(currentLog.total || 0);

  // Helper to unlock
  const unlockBadge = (id) => {
    if (!unlockedMap.has(id)) {
      unlockedMap.set(id, todayStr);
      const badgeMeta = ALL_BADGES.find(b => b.id === id);
      if (badgeMeta) {
        newlyUnlocked.push(badgeMeta);
      }
    }
  };

  // 1. First Step
  if (totalLogs >= 1) {
    unlockBadge('first_step');
  }

  // 2. Green Day
  if (totalEmissions <= budget && totalEmissions > 0) {
    unlockBadge('green_day');
  }

  // 3. 3-Day Streak
  if (streak >= 3) {
    unlockBadge('streak_3');
  }

  // 4. Week Warrior
  if (streak >= 7) {
    unlockBadge('week_warrior');
  }

  // 5. Pedal Power
  if ((travelMode === 'bicycle' || travelMode === 'walking') && travelDist > 0) {
    unlockBadge('pedal_power');
  }

  // 6. Plant Day
  if (dietType === 'vegan' || dietType === 'vegetarian') {
    unlockBadge('plant_day');
  }

  // 7. Low Energy
  // Current log energy emissions must be <= 1.0 kg CO2
  if (energyEmissions <= 1.0) {
    unlockBadge('low_energy');
  }

  // 8. Monthly Hero
  if (totalLogs >= 15) {
    unlockBadge('monthly_hero');
  }

  // 9. Monthly Master
  if (totalLogs >= 30) {
    unlockBadge('monthly_master');
  }

  // 10. Zero Waster
  if (!foodWasted) {
    unlockBadge('zero_waster');
  }

  // Map map back to list
  const updatedBadges = Array.from(unlockedMap.entries()).map(([id, unlocked_at]) => ({
    id,
    unlocked_at
  }));

  return {
    updatedBadges,
    newlyUnlocked
  };
}

import axios from 'axios';

// Configure Axios Instance pointing to the Flask Server
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Helper function to inject the bearer authorization token
const getHeaders = (token) => {
  if (!token) return {};
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const apiService = {
  // Preview emissions before saving
  calculateFootprint: async (data) => {
    const response = await api.post('/api/calculate/footprint', data);
    return response.data;
  },

  // Save today's habits
  logHabit: async (data, token) => {
    const response = await api.post('/api/habits/log', data, getHeaders(token));
    return response.data;
  },

  // Get log for a specific date (defaults to today on backend)
  getTodayLog: async (token, dateStr = null) => {
    const url = dateStr ? `/api/habits/today?date=${dateStr}` : '/api/habits/today';
    const response = await api.get(url, getHeaders(token));
    return response.data;
  },

  // Get last 30 daily logs
  getHistory: async (token) => {
    const response = await api.get('/api/habits/history', getHeaders(token));
    return response.data;
  },

  // Get user profile settings
  getSettings: async (token) => {
    const response = await api.get('/api/habits/settings', getHeaders(token));
    return response.data;
  },

  // Update user profile settings (budget, theme, name)
  updateSettings: async (data, token) => {
    const response = await api.patch('/api/habits/settings', data, getHeaders(token));
    return response.data;
  },

  // Generate 3 personalized AI eco suggestions
  generateSuggestions: async (emissionsData, token) => {
    const response = await api.post('/api/suggestions/generate', emissionsData, getHeaders(token));
    return response.data;
  },

  // Calculate live Carbon Interface electricity estimate
  calculateElectricity: async (data, token) => {
    const response = await api.post('/api/carbon/electricity', data, getHeaders(token));
    return response.data;
  },

  // Calculate live Carbon Interface flight estimate
  calculateFlight: async (data, token) => {
    const response = await api.post('/api/carbon/flight', data, getHeaders(token));
    return response.data;
  },

  // Get unlocked badges
  getBadges: async (token) => {
    const response = await api.get('/api/habits/badges', getHeaders(token));
    return response.data;
  },

  // Write updated badges back to Firestore
  updateBadges: async (badgesList, token) => {
    const response = await api.post('/api/habits/badges', { badges: badgesList }, getHeaders(token));
    return response.data;
  }
};

export default apiService;

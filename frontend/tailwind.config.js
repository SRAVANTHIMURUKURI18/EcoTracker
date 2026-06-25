/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f19',      // Very deep premium dark slate
        cardBg: '#151c2c',      // Modern card background with fine contrast
        accentGreen: '#0dd38e', // Neon emerald green
        accentBlue: '#3b82f6',  // Deep clean blue
        accentAmber: '#f59e0b', // Amber gold
        accentRed: '#ef4444'    // Vivid coral red
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

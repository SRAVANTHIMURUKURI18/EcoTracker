import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser, logout, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // Mobile menu toggle state

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/logger', label: 'Log Today', icon: '📝' },
    { path: '/suggestions', label: 'AI Suggestions', icon: '💡' },
    { path: '/history', label: 'History', icon: '📈' },
    { path: '/badges', label: 'Achievements', icon: '🏆' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  if (!currentUser) return null;

  return (
    <nav className="glass-card sticky top-0 z-50 px-4 py-3 shadow-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Logo & Demo Badge */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-3xl transition-transform group-hover:scale-110 duration-300">🌍</span>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-accentGreen to-emerald-400 bg-clip-text text-transparent">
              EcoTrack
            </span>
          </Link>
          
          {isDemoMode && (
            <span className="bg-accentAmber/10 border border-accentAmber/35 text-accentAmber text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md animate-pulse">
              Demo Mode
            </span>
          )}
        </div>
        
        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-accentGreen text-darkBg shadow-lg shadow-accentGreen/20 font-bold' 
                    : 'text-slate-350 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Session Info & Logout (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Signed in as</p>
            <p className="text-xs font-bold text-slate-300 truncate max-w-[120px]">
              {currentUser.displayName || currentUser.email}
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-slate-700/60 hover:border-accentRed hover:text-accentRed rounded-xl text-xs font-semibold transition-colors duration-300 bg-slate-900/40 text-slate-350"
          >
            Sign Out
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="text-slate-400 hover:text-white focus:outline-none p-1"
            aria-label="Toggle Menu"
          >
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              {isOpen ? (
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18.278 16.864a1 1 0 01-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 01-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 011.414-1.414l4.829 4.828 4.828-4.828a1 1 0 111.414 1.414l-4.828 4.829 4.828 4.828z"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z"
                />
              )}
            </svg>
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-fadeIn">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-accentGreen text-darkBg font-bold' 
                    : 'text-slate-350 hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between px-4 text-xs">
            <span className="text-slate-500 font-bold uppercase">
              {currentUser.displayName || currentUser.email}
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="px-3.5 py-1.5 border border-slate-700/60 hover:border-accentRed hover:text-accentRed rounded-lg font-bold text-slate-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

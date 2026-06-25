import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, tryDemoMode } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter all fields');
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-8 glass-card rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <span className="text-4xl">🌍</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-2 text-white">
            Welcome to <span className="text-accentGreen">EcoTrack</span>
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            Sign in to track your personal carbon budget
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen transition-colors text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentGreen transition-colors text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-accentGreen to-emerald-600 hover:from-emerald-500 hover:to-accentGreen text-darkBg font-bold rounded-xl transition-all duration-300 focus:outline-none shadow-lg shadow-accentGreen/10 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 w-full h-[1px] bg-slate-800"></div>
          <span className="relative bg-cardBg px-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
            or explore
          </span>
        </div>

        <button
          onClick={async () => {
            try {
              setError('');
              setLoading(true);
              await tryDemoMode();
              navigate('/');
            } catch (err) {
              setError('Failed to enter Demo Mode');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="w-full py-3 border border-slate-700 hover:border-accentGreen hover:text-accentGreen text-slate-300 font-bold rounded-xl transition-colors duration-300 focus:outline-none bg-slate-900/40"
        >
          Try Demo Mode
        </button>

        <div className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-accentGreen hover:underline font-semibold">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

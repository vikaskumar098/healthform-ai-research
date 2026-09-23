import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogIn, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('demo@healthform.ai');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to login. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      setError('Demo login failed. Ensure backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full glass-card rounded-2xl p-8 border border-slate-800 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 mx-auto flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Researcher Portal</h2>
          <p className="text-xs text-slate-400">Sign in to access laboratory analysis and claim auditing</p>
        </div>

        {/* Quick Demo Access Button */}
        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-700/60 flex items-center justify-center space-x-2 transition-all shadow-md group"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>1-Click Instant Demo Login (Researcher)</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-slate-800" />
          <span className="px-3 text-xs text-slate-500 uppercase tracking-wider font-mono">or continue with credentials</span>
          <div className="flex-grow border-t border-slate-800" />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="name@university.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-600/20 flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:underline font-medium">
            Register New Account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;

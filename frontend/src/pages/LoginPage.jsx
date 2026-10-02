import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('demo@healthform.ai');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect email or password. Please try again.');
    } finally { setLoading(false); }
  };

  const handleDemo = async () => {
    setError(''); setLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (_) {
      setError('Demo access failed. Please make sure the backend is running.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 animate-fade-in-up">

        {/* Logo + title */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-brand-500/30">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-slate-400">Sign in to see your lab report results</p>
        </div>

        {/* Demo button */}
        <button
          onClick={handleDemo}
          disabled={loading}
          className="group w-full flex items-center justify-center space-x-2.5 py-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 font-semibold text-sm transition-all"
        >
          <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span>Try Demo — No Account Needed</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Divider */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-xs text-slate-600 px-1">or sign in with your account</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-sm text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 glass-card border border-white/[0.07] rounded-3xl p-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/[0.08] text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/25 transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{loading ? 'Signing in…' : 'Sign In'}</span>
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Create one for free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

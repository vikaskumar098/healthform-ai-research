import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Activity,
  FileText,
  ChevronRight,
  Heart,
  ArrowLeft,
} from 'lucide-react';
import HealthFormLogo from '../components/common/HealthFormLogo';

const LoginPage = () => {
  // Empty credentials by default — no hardcoded demo credentials exposed in production UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (val) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedEmail, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError('Email or password is incorrect.');
      } else if (!err.response) {
        setError('Unable to connect. Please try again.');
      } else {
        setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (_) {
      setError('Unable to connect to demo mode. Please verify the backend is running.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#060d1f] text-slate-100 overflow-x-hidden selection:bg-cyan-500 selection:text-white">

      {/* ────────────────────────────────────────────────────────────
          LEFT SIDE: Dark Navy AI/Healthcare Visual Experience (~58%)
          Visible on desktop (>=1024px), hidden on mobile & tablet
          ──────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[60%] flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative overflow-hidden bg-gradient-to-br from-[#060d1f] via-[#081229] to-[#040814] border-b lg:border-b-0 lg:border-r border-white/[0.08]">
        
        {/* Ambient subtle glow effects */}
        <div className="absolute top-1/4 left-1/4 w-[480px] h-[360px] bg-blue-600/12 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-12 left-12 w-[400px] h-[280px] bg-cyan-500/12 rounded-full blur-[110px] pointer-events-none" />

        {/* Top Header Bar: The SINGLE Official Logo Placement */}
        <header className="relative z-10 flex items-center justify-between pb-8">
          <Link to="/" aria-label="HealthForm AI Home" className="transition-opacity hover:opacity-90 inline-block">
            <HealthFormLogo size="md" />
          </Link>
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-medium tracking-wide">
            <span>Trusted</span>
            <span className="text-slate-600">•</span>
            <span>Accurate</span>
            <span className="text-slate-600">•</span>
            <span>Private</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400">AI-Powered</span>
          </div>
        </header>

        {/* Main Hero & Visual Workflow */}
        <div className="relative z-10 my-auto py-6 sm:py-8 space-y-6 lg:space-y-8">
          
          {/* Subtle Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>From Reports to Real Understanding</span>
          </div>

          {/* Primary Headlines */}
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Understand your reports.
            </h1>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300 bg-clip-text text-transparent leading-tight">
              Without the complexity.
            </p>
          </div>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed font-normal">
            HealthForm AI transforms laboratory reports into structured, understandable insights.
          </p>

          {/* ── Connected Product Demonstration Workflow ── */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch relative">
            
            {/* CARD 1: LABORATORY REPORT */}
            <div className="rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/[0.1] p-3.5 shadow-lg space-y-2.5 transition-all hover:border-cyan-500/30">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">REPORT.PDF</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400">CBC Panel</span>
              </div>

              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-slate-300">Hemoglobin</span>
                  <span className="text-white font-semibold">11.2 g/dL</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span className="text-slate-300">WBC Count</span>
                  <span className="text-white font-semibold">7.4 ×10³</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-300">Platelets</span>
                  <span className="text-white font-semibold">245 ×10³</span>
                </div>
              </div>

              <div className="pt-1 text-[9px] text-slate-400 text-center font-sans">
                Laboratory reference bounds parsed
              </div>
            </div>

            {/* CARD 2: AI PROCESSING */}
            <div className="rounded-2xl bg-slate-900/80 backdrop-blur-md border border-cyan-500/25 p-3.5 shadow-lg space-y-2.5 transition-all hover:border-cyan-500/40 relative">
              <div className="flex items-center space-x-1.5 pb-2 border-b border-white/[0.08]">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold text-white">AI Processing</span>
              </div>

              <ul className="space-y-1.5 text-[10px]">
                <li className="flex items-center justify-between text-slate-300">
                  <span>Extract parameters</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </li>
                <li className="flex items-center justify-between text-slate-300">
                  <span>Validate ranges</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </li>
                <li className="flex items-center justify-between text-slate-300">
                  <span>Analyze values</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </li>
                <li className="flex items-center justify-between text-cyan-300 font-medium">
                  <span>Generating insights</span>
                  <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                </li>
              </ul>

              <div className="pt-1 text-[9px] text-cyan-400/80 text-center font-sans">
                Deterministic Medical Guardrails Active
              </div>
            </div>

            {/* CARD 3: STRUCTURED RESULTS */}
            <div className="rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/[0.1] p-3.5 shadow-lg space-y-2.5 transition-all hover:border-cyan-500/30">
              <div className="flex items-center space-x-1.5 pb-2 border-b border-white/[0.08]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-white">Structured Results</span>
              </div>

              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Tests</span>
                  <span className="text-white font-bold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Within Range</span>
                  <span className="text-emerald-400 font-bold">9</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Below Range</span>
                  <span className="text-rose-400 font-bold">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Above Range</span>
                  <span className="text-amber-400 font-bold">1</span>
                </div>
              </div>

              <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-[9px] text-cyan-300 flex items-center justify-between">
                <span>Clear Insights Ready</span>
                <ChevronRight className="w-3 h-3 text-cyan-400" />
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Value Proposition Row */}
        <footer className="relative z-10 pt-6 mt-6 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Secure & Private</p>
              <p className="text-[10px] text-slate-400">Your data is protected</p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">AI-Powered</p>
              <p className="text-[10px] text-slate-400">Advanced analysis</p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Easy to Understand</p>
              <p className="text-[10px] text-slate-400">No medical jargon</p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Heart className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Better Decisions</p>
              <p className="text-[10px] text-slate-400">Control your health</p>
            </div>
          </div>
        </footer>

      </div>


      {/* ────────────────────────────────────────────────────────────
          RIGHT SIDE: Clean Light Authentication Card (~42% desktop, full on mobile/tablet)
          ──────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[42%] xl:w-[40%] flex flex-col justify-between p-4 sm:p-8 lg:p-12 min-h-screen bg-slate-50 text-slate-900 relative">
        
        {/* On Mobile & Tablet (<1024px): Prominent Brand Header with Official Logo & Back */}
        <div className="lg:hidden flex items-center justify-between pb-6 pt-2">
          <Link to="/" aria-label="HealthForm AI Home" className="transition-opacity hover:opacity-90">
            <HealthFormLogo size="sm" />
          </Link>
          <Link 
            to="/" 
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* On Desktop (>=1024px): Subtle Top Bar */}
        <div className="hidden lg:flex items-center justify-between pb-6">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Patient Portal
          </span>
        </div>

        {/* Center Authentication Card (Single Card, NO Duplicate Logo) */}
        <div className="my-auto w-full max-w-[420px] md:max-w-[460px] mx-auto bg-white rounded-3xl p-6 sm:p-8 md:p-9 shadow-xl shadow-slate-200/80 border border-slate-200/80 space-y-5 sm:space-y-6">
          
          {/* Card Header (Welcome Back, without duplicate logo) */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Sign in to continue to your reports.
            </p>
          </div>

          {/* Friendly Inline Error Notice */}
          {error && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-fade-in-up">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Real Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("To reset your password, please contact support or check your verification email.")}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Discreet Secondary Demo Access (Non-intrusive) */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading || demoLoading}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors inline-flex items-center space-x-1"
            >
              <span>Exploring the app?</span>
              {demoLoading ? (
                <span className="font-semibold text-blue-600 flex items-center space-x-1">
                  <Loader2 className="w-3 h-3 animate-spin inline" />
                  <span>Entering Demo...</span>
                </span>
              ) : (
                <span className="font-semibold text-blue-600 hover:underline">Try Demo Mode</span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200/80" />

          {/* Signup Link */}
          <p className="text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Create account
            </Link>
          </p>

        </div>

        {/* Minimal Footer */}
        <div className="text-center pt-6 text-[11px] text-slate-400">
          © 2026 HealthForm AI · Private, secure laboratory report understanding
        </div>

      </div>

    </div>
  );
};

export default LoginPage;

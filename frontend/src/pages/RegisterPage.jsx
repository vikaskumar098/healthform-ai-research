import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  UploadCloud,
  FileCheck,
  BarChart2,
  CheckCircle2,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import HealthFormLogo from '../components/common/HealthFormLogo';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Real-time field validations
  const isNameValid = useMemo(() => fullName.trim().length >= 2, [fullName]);
  
  const isEmailValid = useMemo(() => {
    return /\S+@\S+\.\S+/.test(email.trim());
  }, [email]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8 && /[0-9]/.test(password)) score += 1;
    if (/[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', textCol: 'text-rose-500', barCol: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Medium', textCol: 'text-amber-500', barCol: 'bg-amber-500' };
    return { score: 3, label: 'Strong', textCol: 'text-emerald-500', barCol: 'bg-emerald-500' };
  }, [password]);

  const isPasswordMatch = useMemo(() => {
    return password.length >= 6 && password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!trimmedEmail || !isEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setLoading(true);
    try {
      await register(trimmedEmail, password, trimmedName);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 409) {
        setError(err.response?.data?.detail || 'An account with this email address already exists.');
      } else if (!err.response) {
        setError('Unable to connect to the authentication service. Please check your connection.');
      } else {
        setError(err.response?.data?.detail || 'Account creation failed. Please check your information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#060d1f] text-slate-100 overflow-x-hidden selection:bg-cyan-500 selection:text-white">

      {/* ────────────────────────────────────────────────────────────
          LEFT SIDE: Brand Experience & Product Visualization (~58%)
          Visible on desktop (>=1024px), hidden on mobile & tablet
          ──────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[60%] flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative overflow-hidden bg-gradient-to-br from-[#060d1f] via-[#081229] to-[#040814] border-b lg:border-b-0 lg:border-r border-white/[0.08]">
        
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/4 left-1/4 w-[520px] h-[380px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[420px] h-[300px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header: Official Logo + Brand Tagline */}
        <header className="relative z-10 flex items-center justify-between pb-8">
          <Link to="/" aria-label="HealthForm AI Home" className="transition-opacity hover:opacity-90 inline-block">
            <HealthFormLogo size="md" />
          </Link>
          <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            <span>Simple</span>
            <span className="text-slate-600">•</span>
            <span>Secure</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400">Smarter Health</span>
          </div>
        </header>

        {/* Hero & Interactive Product Preview */}
        <div className="relative z-10 my-auto py-6 sm:py-8 space-y-6 lg:space-y-8">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-medium tracking-wide text-cyan-300 shadow-sm uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Laboratory Reports. Made Simple.</span>
          </div>

          {/* Headlines */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Start understanding
            </h1>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300 bg-clip-text text-transparent leading-tight">
              your laboratory reports better.
            </p>
          </div>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed font-normal">
            Upload your reports, let AI validate and organize the data, and get clear, easy-to-understand insights.
          </p>

          {/* 3-Step Visual Workflow */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center relative">
            
            {/* Step 1 */}
            <div className="flex flex-col space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-cyan-400 shadow-md">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-wide">1. Upload</p>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  Upload your laboratory report (PDF or image).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-md">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-wide">2. Validate</p>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  We extract and validate your data with high accuracy.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-md">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-wide">3. Understand</p>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  Get clear insights in simple language.
                </p>
              </div>
            </div>

          </div>

          {/* ── Realistic Laboratory Report & Floating AI Analysis Visual ── */}
          <div className="pt-4 relative max-w-xl">
            {/* Main Synthetic Laboratory Document Card */}
            <div className="rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/[0.12] p-4 sm:p-5 shadow-2xl relative transition-all">
              
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wider text-white uppercase">LABORATORY REPORT</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                  Complete Blood Count (CBC)
                </span>
              </div>

              {/* Synthetic Data Table */}
              <div className="mt-3 divide-y divide-white/[0.06] text-xs font-mono">
                <div className="grid grid-cols-3 py-1.5 text-[10px] text-slate-400 font-sans uppercase tracking-wider">
                  <span>Parameter</span>
                  <span className="text-center">Observed Result</span>
                  <span className="text-right">Reference Range</span>
                </div>

                <div className="grid grid-cols-3 py-2 items-center">
                  <span className="text-slate-200 font-sans font-medium">Hemoglobin</span>
                  <div className="flex justify-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold">
                      13.5
                    </span>
                  </div>
                  <span className="text-slate-400 text-right">12.0 – 16.0 g/dL</span>
                </div>

                <div className="grid grid-cols-3 py-2 items-center">
                  <span className="text-slate-200 font-sans font-medium">WBC Count</span>
                  <div className="flex justify-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold">
                      7.1
                    </span>
                  </div>
                  <span className="text-slate-400 text-right">4.0 – 11.0 ×10³</span>
                </div>

                <div className="grid grid-cols-3 py-2 items-center">
                  <span className="text-slate-200 font-sans font-medium">RBC Count</span>
                  <div className="flex justify-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold">
                      4.8
                    </span>
                  </div>
                  <span className="text-slate-400 text-right">4.5 – 5.9 ×10⁶</span>
                </div>

                <div className="grid grid-cols-3 py-2 items-center">
                  <span className="text-slate-200 font-sans font-medium">Platelet Count</span>
                  <div className="flex justify-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold">
                      181
                    </span>
                  </div>
                  <span className="text-slate-400 text-right">150 – 450 ×10³</span>
                </div>

                <div className="grid grid-cols-3 py-2 items-center">
                  <span className="text-slate-200 font-sans font-medium">Blood Sugar</span>
                  <div className="flex justify-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold">
                      92
                    </span>
                  </div>
                  <span className="text-slate-400 text-right">70 – 99 mg/dL</span>
                </div>
              </div>
            </div>

            {/* Floating AI Analysis Card (Overlapping bottom right) */}
            <div className="hidden sm:block absolute -bottom-5 -right-3 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 p-3.5 shadow-2xl shadow-cyan-950/60 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-white">AI Analysis</span>
                </div>
                <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  All Normal
                </span>
              </div>

              {/* Glowing Waveform Sparkline */}
              <div className="pt-2">
                <svg className="w-full h-8 overflow-visible" viewBox="0 0 200 40">
                  <defs>
                    <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="50%" stopColor="#00f2fe" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,25 Q 25,5 50,22 T 100,20 T 150,10 T 200,22"
                    fill="none"
                    stroke="url(#gradient-line)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-sans">
                  <span>Confidence</span>
                  <span className="text-cyan-300 font-semibold">99.4% Verified</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Minimal Left Footer */}
        <footer className="relative z-10 pt-6 mt-6 border-t border-white/[0.08] text-xs text-slate-400 flex items-center justify-between">
          <span>Clinical Document Intelligence</span>
          <span>HIPAA & GDPR Ready Architecture</span>
        </footer>

      </div>


      {/* ────────────────────────────────────────────────────────────
          RIGHT SIDE: Clean Bright Signup Card (~42% desktop, full on mobile/tablet)
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

        {/* Center White Signup Card (No duplicate logo) */}
        <div className="my-auto w-full max-w-[430px] md:max-w-[480px] mx-auto bg-white rounded-3xl p-6 sm:p-8 md:p-9 shadow-xl shadow-slate-200/80 border border-slate-200/80 space-y-5 sm:space-y-6">
          
          {/* Card Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Join HealthForm AI and start understanding your laboratory reports better.
            </p>
          </div>

          {/* Inline Error Notice */}
          {error && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-fade-in-up">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="register-name" className="block text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="register-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                {isNameValid && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 pointer-events-none">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                {isEmailValid && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 pointer-events-none">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="register-password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
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

              {/* 3-Segment Password Strength Indicator */}
              {password.length > 0 && (
                <div className="pt-1.5 space-y-1">
                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    <div className={`rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.barCol : 'bg-slate-200'}`} />
                    <div className={`rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.barCol : 'bg-slate-200'}`} />
                    <div className={`rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.barCol : 'bg-slate-200'}`} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span className={passwordStrength.score === 1 ? passwordStrength.textCol : ''}>Weak</span>
                    <span className={passwordStrength.score === 2 ? passwordStrength.textCol : ''}>Medium</span>
                    <span className={passwordStrength.score === 3 ? passwordStrength.textCol : ''}>Strong</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="register-confirm-password" className="block text-xs font-semibold text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="text-[11px] pt-0.5">
                  {isPasswordMatch ? (
                    <span className="text-emerald-600 font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 inline" />
                      <span>Passwords match</span>
                    </span>
                  ) : (
                    <span className="text-rose-500 font-medium">
                      Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.99] transition-all shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Assurance Badge */}
          <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 pt-1">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Your information is handled securely.</span>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200/80" />

          {/* Sign in navigation link */}
          <p className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign in
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

export default RegisterPage;

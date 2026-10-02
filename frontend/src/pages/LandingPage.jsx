import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

/* ─── How it works steps ─────────────────────────────── */
const HOW_STEPS = [
  {
    icon: UploadCloud,
    color: 'from-brand-500 to-brand-600',
    glow: 'shadow-brand-500/30',
    title: 'Upload your report',
    desc: 'Drag-and-drop or browse for a PDF or image of your lab report.',
  },
  {
    icon: Sparkles,
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/30',
    title: 'We read it for you',
    desc: 'Our AI extracts every test result and compares it to your report\'s own reference ranges.',
  },
  {
    icon: FileText,
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/30',
    title: 'See a clear summary',
    desc: 'Get a simple, plain-English explanation of what each result means — no medical jargon.',
  },
  {
    icon: TrendingUp,
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/30',
    title: 'Track over time',
    desc: 'Compare results across multiple reports to see how your numbers change.',
  },
];

/* ─── Trust features ─────────────────────────────────── */
const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'No diagnosis', desc: 'We explain; we never diagnose' },
  { icon: CheckCircle2, label: 'Grounded facts', desc: 'Every statement comes from your own report' },
  { icon: ShieldCheck, label: 'Private processing', desc: 'Your data is not shared or sold' },
];

const LandingPage = () => {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemo = async () => {
    try { await demoLogin(); } catch (_) {}
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">

      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden flex-grow flex flex-col items-center justify-center py-24 px-4 sm:px-6">
        {/* background decoration */}
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          {/* badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-sm text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span>Your lab reports, explained simply</span>
          </div>

          {/* headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight animate-fade-in-up">
            Understand your{' '}
            <span className="bg-gradient-to-r from-brand-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              lab results
            </span>
            <br />in plain English
          </h1>

          {/* subheading */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed animate-fade-in-up animate-fade-in-up-delay-1">
            Upload your blood test or lab report and instantly get a clear, simple explanation — without confusing numbers or medical jargon.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-fade-in-up-delay-2">
            {user ? (
              <Link
                to="/upload"
                className="group flex items-center space-x-2 px-8 py-4 rounded-2xl text-base font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-xl shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Upload a Report</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <button
                  onClick={handleDemo}
                  className="group flex items-center space-x-2 px-8 py-4 rounded-2xl text-base font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-xl shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Try a Free Demo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link
                  to="/register"
                  className="flex items-center space-x-2 px-8 py-4 rounded-2xl text-base font-medium text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] transition-all hover:scale-105 active:scale-95"
                >
                  <span>Create Free Account</span>
                </Link>
              </>
            )}
          </div>

          {/* safety note */}
          <p className="text-xs text-slate-500 animate-fade-in-up animate-fade-in-up-delay-3">
            🔒 For informational purposes only · Not a medical diagnosis · Always consult your doctor
          </p>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900/40 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How it works</h2>
            <p className="text-slate-400 mt-2">From upload to understanding — in under a minute</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="glass-card glass-card-hover rounded-2xl p-6 border border-white/[0.07] space-y-4"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg ${step.glow}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-500 mb-1">Step {i + 1}</div>
                    <h3 className="font-semibold text-white text-base">{step.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── TRUST STRIP ───────────── */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TRUST_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center space-x-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── FINAL CTA ───────────── */}
      {!user && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Ready to understand your results?
            </h2>
            <p className="text-slate-400">
              It's free to try. No credit card needed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleDemo}
                className="group w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-xl shadow-brand-600/30 transition-all hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                <span>Try Demo Now</span>
              </button>
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-2xl font-medium text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] transition-all hover:scale-105"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default LandingPage;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  FileText,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Sliders,
  Lock,
  Play,
  Lightbulb,
  BookOpen,
  Zap,
  Target,
} from 'lucide-react';
import ParticleCanvas from '../components/common/ParticleCanvas';
import ScrollReveal from '../components/common/ScrollReveal';
import WaveformSVG from '../components/common/WaveformSVG';

/* ─── HOW IT WORKS STEPS ─────────────────────────────────────────── */
const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Upload Report',
    description: 'Upload your laboratory report (PDF or image format).',
    icon: UploadCloud,
    accent: 'from-blue-600 to-cyan-500',
    glow: 'rgba(34,211,238,0.3)',
  },
  {
    step: '02',
    title: 'AI Analysis',
    description: 'We extract and validate key laboratory parameters.',
    icon: ShieldCheck,
    accent: 'from-cyan-500 to-teal-500',
    glow: 'rgba(20,184,166,0.3)',
  },
  {
    step: '03',
    title: 'Get Insights',
    description: 'Receive structured results with clear explanations.',
    icon: Activity,
    accent: 'from-blue-500 to-indigo-600',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    step: '04',
    title: 'Take Action',
    description: 'Make informed health decisions with confidence.',
    icon: Lightbulb,
    accent: 'from-indigo-500 to-purple-600',
    glow: 'rgba(139,92,246,0.3)',
  },
];

/* ─── POWERFUL FEATURES ─────────────────────────────────────────── */
const POWERFUL_FEATURES = [
  { title: 'AI Report Understanding', description: 'Turn complex lab data into simple, easy-to-understand insights using advanced AI.', icon: FileText, delay: 0 },
  { title: 'Smart Validation', description: 'Detect missing values, check reference ranges, and ensure reliable analysis.', icon: ShieldCheck, delay: 80 },
  { title: 'Reference Range Analysis', description: 'Compare your results with standard laboratory ranges and understand what they mean.', icon: Sliders, delay: 160 },
  { title: 'Evidence-Based Explanations', description: 'Get explanations grounded in trusted medical literature and clinical guidelines.', icon: BookOpen, delay: 240 },
  { title: 'Historical Comparison', description: 'Track how laboratory biomarker values change across successive appointments.', icon: TrendingUp, delay: 320 },
  { title: 'Privacy First', description: 'Keep sensitive laboratory information protected throughout the workflow with zero automated prescribing.', icon: Lock, delay: 400 },
];

/* ─── MOUSE PARALLAX HOOK ────────────────────────────────────────── */
function useMouseParallax(strength = 12) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouchDevice || prefersReduced) return;

    const handleMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * strength;
      const ny = (e.clientY / window.innerHeight - 0.5) * strength;
      targetRef.current = { x: nx, y: ny };
    };

    const animate = () => {
      const LERP = 0.055;
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * LERP;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * LERP;
      setPos({ x: currentRef.current.x, y: currentRef.current.y });
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [strength]);

  return pos;
}

/* ─── ANIMATED STAT COUNTER ──────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '', duration = 1500 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const animStarted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animStarted.current) {
          animStarted.current = true;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── HERO PRODUCT VISUALIZATION ────────────────────────────────── */
const HeroProductVisualization = ({ parallax }) => {
  const [activeWorkflow, setActiveWorkflow] = useState(1);
  const [scanActive] = useState(true);

  return (
    <div className="relative w-full max-w-6xl mx-auto select-none py-6">
      
      {/* Ambient background glows */}
      <div 
        className="absolute top-1/2 left-1/2 w-[700px] h-[450px] bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-indigo-600/15 rounded-full blur-[140px] pointer-events-none transition-transform duration-100"
        style={{
          transform: `translate(calc(-50% + ${parallax.x * 0.3}px), calc(-50% + ${parallax.y * 0.3}px))`,
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col xl:flex-row items-center justify-center gap-6 xl:gap-8">

        {/* ── LEFT: WORKFLOW PILL BUTTONS ── */}
        <div className="flex flex-row xl:flex-col gap-3 z-20 w-full xl:w-auto justify-center">
          {[
            { id: 0, icon: UploadCloud, label: 'Upload', sublabel: 'Lab Report', color: 'blue' },
            { id: 1, icon: Sparkles, label: 'AI Analysis', sublabel: 'Processing', color: 'cyan' },
            { id: 2, icon: Activity, label: 'Structured', sublabel: 'Results', color: 'indigo' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeWorkflow === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveWorkflow(item.id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border transition-all duration-300 text-left backdrop-blur-xl ${
                  isActive
                    ? 'bg-blue-600/25 border-cyan-400/50 shadow-lg shadow-cyan-500/20 text-white scale-[1.02]'
                    : 'bg-slate-900/80 border-white/[0.08] text-slate-300 hover:border-white/20 hover:scale-[1.01]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isActive ? 'bg-blue-500/30 border border-blue-400/50 text-cyan-300' : 'bg-white/[0.04] border border-white/[0.08] text-slate-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[11px] text-slate-400">{item.sublabel}</p>
                </div>
                {isActive && (
                  <div className="ml-auto hidden sm:flex space-x-0.5 text-cyan-400" style={{ height: 24, alignItems: 'flex-end' }}>
                    {[1,2,3,2,1,3,2].map((h, i) => (
                      <div
                        key={i}
                        className="waveform-bar"
                        style={{ height: h * 6, animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── CENTER: LABORATORY REPORT DOCUMENT ── */}
        <div
          className="relative w-full max-w-[460px] rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-white/[0.14] p-5 sm:p-6 shadow-2xl shadow-cyan-950/40 text-slate-100 holo-card overflow-hidden"
          style={{
            transform: `translateX(${parallax.x * 0.6}px) translateY(${parallax.y * 0.6}px)`,
            transition: 'transform 0.1s ease',
          }}
        >
          {/* Scanning beam */}
          {activeWorkflow === 1 && scanActive && (
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-3xl">
              <div className="scan-line" />
            </div>
          )}

          {/* Document Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs animate-pulse-glow">
                +
              </div>
              <span className="font-bold text-sm text-white tracking-wide">CityCare Diagnostics</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
              Complete Blood Count
            </span>
          </div>

          {/* Patient Metadata */}
          <div className="py-2.5 grid grid-cols-2 gap-y-1 gap-x-2 text-[10px] font-mono text-slate-400 border-b border-white/[0.06]">
            <div>Patient Name: <span className="text-slate-200">Rahul Sharma</span></div>
            <div>Patient ID: <span className="text-slate-200">CCD8226091701</span></div>
            <div>Age / Gender: <span className="text-slate-200">26 Yrs / Male</span></div>
            <div>Report Date: <span className="text-slate-200">18-Sep-2026</span></div>
          </div>

          {/* Table of Biomarkers */}
          <div className="pt-2 text-xs font-mono">
            <div className="grid grid-cols-4 py-1.5 text-[10px] text-slate-400 font-sans uppercase tracking-wider border-b border-white/[0.06]">
              <span className="col-span-1">Test Name</span>
              <span className="text-center">Result</span>
              <span className="text-center">Reference</span>
              <span className="text-right">Status</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {[
                { name: 'Hemoglobin (Hb)', val: '11.2', ref: '13.0 – 17.0', status: 'Low', statusColor: 'rose' },
                { name: 'Total WBC Count', val: '7.4', ref: '4.0 – 11.0', status: 'Normal', statusColor: 'emerald' },
                { name: 'Platelet Count', val: '245', ref: '150 – 450', status: 'Normal', statusColor: 'emerald' },
                { name: 'RBC Count', val: '4.1', ref: '4.5 – 5.5', status: 'Low', statusColor: 'rose' },
                { name: 'Hematocrit (HCT)', val: '36.0', ref: '40 – 50', status: 'Low', statusColor: 'rose' },
                { name: 'MCV', val: '87.2', ref: '80 – 100', status: 'Normal', statusColor: 'emerald' },
              ].map((row, i) => (
                <div key={row.name} className="grid grid-cols-4 py-2 items-center" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className={`font-sans font-medium ${row.statusColor === 'rose' ? 'text-rose-300' : 'text-slate-200'}`}>{row.name}</span>
                  <span className={`text-center font-bold ${row.statusColor === 'rose' ? 'text-rose-400' : 'text-emerald-400'}`}>{row.val}</span>
                  <span className="text-center text-slate-400 text-[10px]">{row.ref}</span>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      row.statusColor === 'rose'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Signature */}
          <div className="pt-3 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-mono text-cyan-400">✓ Deterministic Range Match</span>
            <div className="text-right">
              <span className="font-serif italic text-slate-300 block">Dr. A. Mehta</span>
              <span className="text-[9px] text-slate-500">MD (Pathology)</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: AI ANALYSIS RESULTS CARD ── */}
        <div
          className="w-full xl:w-[360px] rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 p-5 sm:p-6 shadow-2xl shadow-cyan-950/60 space-y-4 holo-card"
          style={{
            transform: `translateX(${parallax.x * 0.9}px) translateY(${parallax.y * 0.7}px)`,
            transition: 'transform 0.1s ease',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-slow" />
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-sm text-white">AI Analysis Results</span>
            </div>
            <div className="flex items-center space-x-1 text-cyan-400" style={{ height: 18, alignItems: 'flex-end' }}>
              {[1,2,3,2,1].map((h, i) => (
                <div key={i} className="waveform-bar" style={{ height: h * 4, animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </div>

          {/* Analyzed Result Cards */}
          <div className="space-y-2.5">
            {[
              { name: 'Hemoglobin (Hb)', val: '11.2 g/dL', status: 'Low', dir: 'down', color: 'rose' },
              { name: 'Total WBC Count', val: '7.4 ×10³/µL', status: 'Normal', dir: 'up', color: 'emerald' },
              { name: 'Platelet Count', val: '245 ×10³/µL', status: 'Normal', dir: 'up', color: 'emerald' },
            ].map((item, i) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-cyan-500/40 transition-all duration-300 card-3d cursor-default"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    item.color === 'rose' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.dir === 'down'
                      ? <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      : <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    }
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.val}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.color === 'rose'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>{item.status}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            ))}
          </div>

          {/* Action Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/70 to-cyan-950/70 border border-cyan-500/30 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 flex-shrink-0 animate-pulse-glow">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-300 leading-snug font-normal">
                Get clear, easy-to-understand explanations and health insights for your results.
              </p>
            </div>
            <Link
              to="/upload"
              className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center flex-shrink-0 transition-all shadow-md shadow-cyan-500/30 ml-2 hover:scale-110 active:scale-95"
              title="Explore insights"
            >
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>

      </div>

      {/* Waveform decoration at bottom */}
      <div className="flex justify-center mt-8 opacity-30">
        <WaveformSVG width={400} height={40} color="rgba(34, 211, 238, 0.8)" animDuration={4} />
      </div>
    </div>
  );
};

/* ─── MAIN LANDING PAGE ─────────────────────────────────────────── */
const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const parallax = useMouseParallax(10);

  const handleCtaClick = () => navigate('/upload');
  const handleHowItWorksScroll = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#06132b] text-slate-100 overflow-x-hidden selection:bg-cyan-500 selection:text-white">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HERO SECTION
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden">

        {/* Particle field */}
        <div className="absolute inset-0 z-0">
          <ParticleCanvas count={50} speed={0.2} maxRadius={2} />
        </div>

        {/* Ambient top glow */}
        <div
          className="absolute top-0 left-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent rounded-full blur-[140px] pointer-events-none"
          style={{ transform: `translateX(calc(-50% + ${parallax.x * 0.5}px))` }}
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none z-0" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">

            {/* Badge */}
            <div
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-cyan-950/80 border border-cyan-500/30 text-xs sm:text-sm font-medium text-cyan-300 shadow-lg shadow-cyan-500/10 animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-slow" />
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI-Powered Laboratory Report Understanding</span>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              Understand Your <br />
              Lab Reports <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300 bg-clip-text text-transparent animate-gradient-shift">
                with Clarity.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p
              className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              HealthForm AI transforms complex laboratory reports into clear, structured, and easy-to-understand insights using advanced AI.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              <button
                type="button"
                onClick={handleCtaClick}
                className="group w-full sm:w-auto px-7 py-3.5 rounded-full text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/30 hover:shadow-cyan-500/50 active:scale-[0.99] transition-all flex items-center justify-center space-x-2.5 cursor-pointer btn-glow"
              >
                <UploadCloud className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Analyze Your Report →</span>
              </button>

              <button
                type="button"
                onClick={handleHowItWorksScroll}
                className="group w-full sm:w-auto px-6 py-3.5 rounded-full text-base font-medium text-slate-200 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-white/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-cyan-400 fill-cyan-400 group-hover:scale-110 transition-transform" />
                <span>See How It Works</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div
              className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-t border-white/[0.08] mt-10 animate-fade-in-up"
              style={{ animationDelay: '500ms' }}
            >
              {[
                { icon: ShieldCheck, title: 'Secure & Private', sub: 'Your data is always protected' },
                { icon: Activity, title: 'Accurate Analysis', sub: 'Trusted medical references' },
                { icon: Lock, title: 'Privacy First', sub: 'Built with privacy in mind' },
                { icon: Sparkles, title: 'AI-Powered Insights', sub: 'Faster, smarter understanding' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start space-x-2.5 group">
                    <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-400">{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hero product visualization */}
          <div
            className="mt-12 animate-fade-in-up"
            style={{ animationDelay: '600ms' }}
          >
            <HeroProductVisualization parallax={parallax} />
          </div>
        </div>
      </section>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. HOW IT WORKS
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="how-it-works" className="py-20 md:py-28 relative border-t border-white/[0.06] bg-[#050e21] overflow-hidden">
        
        {/* Subtle background particles */}
        <div className="absolute inset-0 z-0 opacity-50">
          <ParticleCanvas count={20} speed={0.15} maxRadius={1.5} color1="34,211,238" color2="99,102,241" color3="16,185,129" />
        </div>

        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          
          <ScrollReveal variant="up" threshold={0.2} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-xs text-blue-300">
              <Zap className="w-3.5 h-3.5" />
              <span>Simple 4-Step Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How It Works
            </h2>
            <p className="text-base text-slate-400">
              From your lab report to clear insights in simple steps.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {HOW_IT_WORKS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.step} variant="up" delay={idx * 100} threshold={0.15}>
                  <div className="rounded-3xl bg-slate-900/80 border border-white/[0.08] hover:border-cyan-500/30 p-6 transition-all relative flex flex-col justify-between h-full card-3d holo-card group">
                    
                    {/* Step glow on hover */}
                    <div
                      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ boxShadow: `0 0 40px -10px ${step.glow}` }}
                    />

                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/40 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          {step.step}
                        </span>
                        <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 group-hover:text-cyan-300 transition-all">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{step.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                      </div>
                    </div>

                    {idx < 3 && (
                      <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-600 z-20 group-hover:text-cyan-500 transition-colors">
                        →
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. POWERFUL FEATURES
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="features" className="py-20 md:py-28 relative border-t border-white/[0.06] bg-[#06132b] overflow-hidden">

        {/* Ambient glow */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <ScrollReveal variant="left" className="space-y-2 max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Powerful Features
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                Everything you need to understand your laboratory reports better.
              </p>
            </ScrollReveal>
            <ScrollReveal variant="right" delay={100}>
              <Link
                to="/upload"
                className="mt-4 md:mt-0 inline-flex items-center space-x-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group"
              >
                <span>Explore All Features</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {POWERFUL_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <ScrollReveal key={feat.title} variant="up" delay={feat.delay} threshold={0.1}>
                  <div className="rounded-3xl bg-slate-900/70 border border-white/[0.08] hover:border-cyan-500/40 p-6 transition-all space-y-3 group card-3d holo-card h-full">
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/15 group-hover:border-cyan-400/30 transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. TRANSPARENT AI PIPELINE
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="research" className="py-20 md:py-28 relative border-t border-white/[0.06] bg-[#050e21] overflow-hidden">

        <div className="absolute inset-0 z-0 opacity-30">
          <ParticleCanvas count={15} speed={0.1} maxRadius={1.2} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          
          <ScrollReveal variant="up" className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scientific Rigor & Transparency</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built for Transparent Analysis
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Deterministic medical validation combined with grounded explanations.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { label: 'Document Validation', desc: 'Pre-flight format gatekeeping' },
              { label: 'Structured Extraction', desc: 'OCR & table structure' },
              { label: 'Reference Range Validation', desc: 'Strict lab bounds check' },
              { label: 'Grounded Explanation', desc: 'Evidence-backed context' },
              { label: 'Claim Verification', desc: 'Atomic proposition audits' },
              { label: 'Historical Comparison', desc: 'Longitudinal trend deltas' },
            ].map((step, idx) => (
              <ScrollReveal key={step.label} variant="up" delay={idx * 80} threshold={0.1}>
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-1.5 text-center hover:border-cyan-500/30 transition-all card-3d group h-full">
                  <span className="text-[10px] font-mono text-cyan-400 group-hover:text-cyan-300 transition-colors">0{idx + 1}</span>
                  <p className="text-xs font-bold text-white">{step.label}</p>
                  <p className="text-[10px] text-slate-400">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Waveform decoration */}
          <ScrollReveal variant="fade" delay={200} className="flex justify-center mt-12 opacity-20">
            <WaveformSVG width={600} height={50} color="rgba(34, 211, 238, 0.9)" animDuration={5} strokeWidth={2} />
          </ScrollReveal>
        </div>
      </section>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. FINAL CALL TO ACTION
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 md:py-28 relative border-t border-white/[0.06] bg-gradient-to-b from-[#06132b] to-[#040915] text-center overflow-hidden">

        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] bg-blue-500/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Subtle grid */}
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">

          <ScrollReveal variant="up" className="space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to understand your next report?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
              Upload a laboratory report and turn complex values into clear, structured insights in seconds.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="scale" delay={200} className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleCtaClick}
              className="group px-8 py-4 rounded-full text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-xl shadow-cyan-500/25 active:scale-[0.99] transition-all flex items-center space-x-2.5 cursor-pointer btn-glow"
            >
              <UploadCloud className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Analyze Your Report →</span>
            </button>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;

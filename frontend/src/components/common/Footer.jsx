import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Check,
  ShieldCheck,
  Mail,
  ArrowUpRight,
} from 'lucide-react';
import HealthFormLogo from './HealthFormLogo';

const Footer = () => {
  const location = useLocation();

  const handleHashClick = (e, hashId) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="relative border-t border-white/[0.08] bg-[#020817] text-slate-400 overflow-hidden select-none">
      
      {/* Subtle Ambient Radial Glow behind the Brand section */}
      <div className="absolute -top-24 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        
        {/* ── 5-COLUMN TOP SECTION ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10 lg:gap-8 pb-14">
          
          {/* COLUMN 1: BRAND EXPERIENCE */}
          <div className="md:col-span-3 lg:col-span-1 space-y-4">
            <Link to="/" aria-label="HealthForm AI Home" className="inline-block transition-opacity hover:opacity-90">
              <HealthFormLogo size="md" />
            </Link>
            
            <p className="text-xs font-semibold tracking-wide text-cyan-400">
              Understand. Analyze. Take Control.
            </p>
            
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Turn complex laboratory reports into clear, structured and understandable insights with AI.
            </p>

            {/* Small Trust Indicators */}
            <div className="pt-2 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Evidence-aware</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Privacy focused</span>
              </div>
            </div>

            {/* Minimal Social & Contact Icons */}
            <div className="pt-3 flex items-center space-x-2.5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all duration-150 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all duration-150 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
              <a
                href="mailto:support@healthform.ai"
                aria-label="Email"
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all duration-150 hover:-translate-y-0.5"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* COLUMN 2: PRODUCT */}
          <div className="space-y-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Product
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Overview
                </Link>
              </li>
              <li>
                <Link to="/upload" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Analyze Report
                </Link>
              </li>
              <li>
                <Link to="/history" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  My Reports
                </Link>
              </li>
              <li>
                <Link to="/history" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  History
                </Link>
              </li>
              <li>
                <Link to="/comparison" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Compare Reports
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: PLATFORM */}
          <div className="space-y-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Platform
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link 
                  to="/#how-it-works" 
                  onClick={(e) => handleHashClick(e, 'how-it-works')}
                  className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link 
                  to="/#features" 
                  onClick={(e) => handleHashClick(e, 'features')}
                  className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link to="/research" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Research
                </Link>
              </li>
              <li>
                <Link to="/research" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/settings" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Security
                </Link>
              </li>
              <li>
                <Link to="/settings" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: ACCOUNT */}
          <div className="space-y-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Account
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/login" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Log In
                </Link>
              </li>
              <li>
                <Link to="/register" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/profile" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/settings" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 5: RESOURCES */}
          <div className="space-y-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Resources
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/research" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Research
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5">
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  to="/#features" 
                  onClick={(e) => handleHashClick(e, 'features')}
                  className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@healthform.ai" 
                  className="inline-block text-slate-400 hover:text-cyan-300 transition-all duration-150 hover:-translate-y-0.5"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* ── SUBTLE HORIZONTAL DIVIDER ── */}
        <div className="border-t border-white/[0.08] pt-8 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            
            {/* Left: Copyright & Purpose Statement */}
            <div className="text-center md:text-left space-y-1">
              <p className="text-slate-400">
                © 2026 HealthForm AI. All rights reserved.
              </p>
              <p className="text-[11px] text-slate-500 font-normal">
                Built for educational and research-oriented laboratory report understanding.
              </p>
            </div>

            {/* Right: Legal Links */}
            <div className="flex items-center space-x-6 text-xs text-slate-400">
              <Link to="/settings" className="hover:text-cyan-300 transition-colors">
                Privacy
              </Link>
              <Link to="/settings" className="hover:text-cyan-300 transition-colors">
                Terms
              </Link>
              <Link to="/settings" className="hover:text-cyan-300 transition-colors">
                Security
              </Link>
            </div>

          </div>
        </div>

        {/* ── COMPACT MEDICAL DISCLAIMER (EXACTLY ONCE) ── */}
        <div className="pt-4 border-t border-white/[0.04]">
          <p className="text-[11px] text-slate-500 text-center leading-relaxed max-w-4xl mx-auto font-normal">
            HealthForm AI provides informational and educational assistance only. It does not provide medical diagnosis, treatment, or medical advice. Always consult a qualified healthcare professional for clinical decisions.
          </p>
        </div>

      </div>

    </footer>
  );
};

export default Footer;

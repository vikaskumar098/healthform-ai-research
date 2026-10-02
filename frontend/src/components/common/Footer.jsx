import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-white/[0.06] bg-slate-950 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-slate-300">HealthForm AI</span>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start space-x-2 max-w-xl text-center md:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              For informational purposes only. This tool does{' '}
              <strong className="text-slate-400">not</strong> provide medical diagnosis,
              prescribe treatments, or replace a licensed doctor.
              Always consult a qualified healthcare professional.
            </p>
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-600 whitespace-nowrap">
            © 2026 HealthForm AI
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

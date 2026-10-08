import React from 'react';
import { FileText } from 'lucide-react';

const ReportThumbnail = ({ type = 'CBC Report', date = '', size = 'md', className = '' }) => {
  const isCbc = type.toLowerCase().includes('cbc');
  const isLipid = type.toLowerCase().includes('lipid');
  const isThyroid = type.toLowerCase().includes('thyroid');
  const isLiver = type.toLowerCase().includes('liver') || type.toLowerCase().includes('lft');

  const bannerColor = isCbc
    ? 'from-blue-600 to-indigo-600'
    : isLipid
    ? 'from-amber-600 to-orange-600'
    : isThyroid
    ? 'from-purple-600 to-pink-600'
    : isLiver
    ? 'from-emerald-600 to-teal-600'
    : 'from-blue-600 to-cyan-600';

  const sizeClasses = {
    sm: 'w-10 h-14 text-[6px]',
    md: 'w-16 h-22 text-[7px]',
    lg: 'w-20 h-28 text-[8px]',
  };

  return (
    <div
      className={`relative rounded-md bg-slate-900 border border-white/10 shadow-lg shadow-black/40 overflow-hidden flex flex-col p-1.5 select-none flex-shrink-0 group-hover:border-cyan-500/40 transition-all ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      {/* Top Header stripe */}
      <div className={`h-1.5 w-full rounded-sm bg-gradient-to-r ${bannerColor} mb-1`} />
      
      {/* Hospital/Lab header mockup */}
      <div className="flex items-center space-x-1 mb-1.5 opacity-70">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <div className="h-1 w-7 bg-slate-400/80 rounded" />
      </div>

      {/* Structured report lines mockup */}
      <div className="space-y-1 flex-1">
        <div className="flex justify-between items-center">
          <div className="h-0.5 w-5 bg-slate-500/80 rounded" />
          <div className="h-0.5 w-2 bg-slate-400/60 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-0.5 w-6 bg-slate-500/80 rounded" />
          <div className="h-0.5 w-2 bg-rose-400/80 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-0.5 w-4 bg-slate-500/80 rounded" />
          <div className="h-0.5 w-2 bg-slate-400/60 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-0.5 w-5 bg-slate-500/80 rounded" />
          <div className="h-0.5 w-2 bg-emerald-400/80 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-0.5 w-6 bg-slate-500/80 rounded" />
          <div className="h-0.5 w-2 bg-slate-400/60 rounded" />
        </div>
      </div>

      {/* Bottom stamp */}
      <div className="pt-1 border-t border-white/5 flex items-center justify-between opacity-50">
        <div className="h-0.5 w-3 bg-slate-500 rounded" />
        <div className="w-1.5 h-1.5 rounded-full border border-cyan-400/60" />
      </div>
    </div>
  );
};

export default ReportThumbnail;

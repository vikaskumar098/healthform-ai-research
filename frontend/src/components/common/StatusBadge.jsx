import React from 'react';
import { CheckCircle2, ArrowDownCircle, ArrowUpCircle, HelpCircle } from 'lucide-react';

const StatusBadge = ({ status, flag }) => {
  switch (status) {
    case 'within_reported_range':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Within Range</span>
        </span>
      );

    case 'below_reported_range':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/60 shadow-sm">
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>Below Reported Range {flag ? `[${flag}]` : ''}</span>
        </span>
      );

    case 'above_reported_range':
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/60 shadow-sm">
          <ArrowUpCircle className="w-3.5 h-3.5" />
          <span>Above Reported Range {flag ? `[${flag}]` : ''}</span>
        </span>
      );

    case 'unknown':
    default:
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 shadow-sm">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Range Unstated</span>
        </span>
      );
  }
};

export default StatusBadge;

import { Check, ArrowDown, ArrowUp, HelpCircle } from 'lucide-react';

const StatusBadge = ({ status, flag, size = 'md' }) => {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'within_reported_range':
      return (
        <span className={`inline-flex items-center space-x-1.5 ${pad} rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25`}>
          <Check className={`${iconSize} stroke-[2.5]`} />
          <span>Within Range</span>
        </span>
      );

    case 'below_reported_range':
      return (
        <span className={`inline-flex items-center space-x-1.5 ${pad} rounded-full font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/25`}>
          <ArrowDown className={`${iconSize} stroke-[2.5]`} />
          <span>Below Range{flag ? ` [${flag}]` : ''}</span>
        </span>
      );

    case 'above_reported_range':
      return (
        <span className={`inline-flex items-center space-x-1.5 ${pad} rounded-full font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25`}>
          <ArrowUp className={`${iconSize} stroke-[2.5]`} />
          <span>Above Range{flag ? ` [${flag}]` : ''}</span>
        </span>
      );

    case 'unknown':
    default:
      return (
        <span className={`inline-flex items-center space-x-1.5 ${pad} rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700/60`}>
          <HelpCircle className={iconSize} />
          <span>Unable to determine</span>
        </span>
      );
  }
};

export default StatusBadge;

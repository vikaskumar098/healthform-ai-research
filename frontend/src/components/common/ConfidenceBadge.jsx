import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

const ConfidenceBadge = ({ confidence, validationStatus, errors = [] }) => {
  const pct = Math.round((confidence || 0.95) * 100);

  let badgeColor = "text-emerald-400 bg-emerald-950/40 border-emerald-800/50";
  let Icon = ShieldCheck;

  if (validationStatus === "warning" || pct < 80) {
    badgeColor = "text-amber-400 bg-amber-950/40 border-amber-800/50";
    Icon = AlertTriangle;
  } else if (validationStatus === "invalid" || pct < 60) {
    badgeColor = "text-rose-400 bg-rose-950/40 border-rose-800/50";
    Icon = AlertOctagon;
  }

  return (
    <div className="flex items-center space-x-1.5" title={errors.length > 0 ? errors.join("; ") : "Extraction verified by validation rules"}>
      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium border ${badgeColor}`}>
        <Icon className="w-3 h-3" />
        <span>{pct}%</span>
      </span>
      {errors.length > 0 && (
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title={errors[0]} />
      )}
    </div>
  );
};

export default ConfidenceBadge;

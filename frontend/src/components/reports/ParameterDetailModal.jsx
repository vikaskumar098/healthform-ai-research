import React, { useState } from 'react';
import { X, Info, Activity, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { getTestMeaning, getTestEducationalContext } from '../../utils/medicalContext';

const ParameterDetailModal = ({ parameter, onClose }) => {
  const [showTechnical, setShowTechnical] = useState(false);

  if (!parameter) return null;

  const meaning = getTestMeaning(parameter);
  const educationalContext = getTestEducationalContext(parameter.test_name);
  const refDisplay = parameter.reference_range?.raw 
    || (parameter.reference_range?.low !== undefined && parameter.reference_range?.high !== undefined
        ? `${parameter.reference_range.low} – ${parameter.reference_range.high} ${parameter.unit || ''}`.trim()
        : 'Reference range not provided in the report');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">{parameter.test_name}</h3>
              <p className="text-xs text-slate-400">Test Details & Interpretation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Results Display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
          <div className="p-2">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Your Result</p>
            <p className="text-2xl font-bold text-white font-mono mt-1">
              {parameter.value} <span className="text-xs font-normal text-slate-400">{parameter.unit || ''}</span>
            </p>
          </div>
          <div className="p-2 sm:border-l sm:border-white/[0.06] sm:pl-4">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Lab Reference</p>
            <p className="text-sm font-semibold text-slate-200 mt-1.5">
              {refDisplay}
            </p>
          </div>
          <div className="p-2 sm:border-l sm:border-white/[0.06] sm:pl-4">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Status</p>
            <StatusBadge status={parameter.status} flag={parameter.flag} />
          </div>
        </div>

        {/* What this means */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-brand-400" />
            <span>What this means</span>
          </h4>
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.06] text-sm text-slate-200 leading-relaxed">
            {meaning}
          </div>
        </div>

        {/* Why this matters (Educational) */}
        {educationalContext && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Why this test matters
            </h4>
            <div className="p-4 rounded-2xl bg-slate-950/20 border border-white/[0.04] text-xs sm:text-sm text-slate-400 leading-relaxed">
              {educationalContext}
            </div>
          </div>
        )}

        {/* Safety Note */}
        <div className="p-3.5 rounded-xl bg-slate-950/30 border border-white/[0.04] text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">Important note:</span> Laboratory reference ranges vary depending on the testing facility, equipment, and your personal medical background. This information is educational and should be reviewed with your doctor.
        </div>

        {/* Expandable Technical / Provenance Details (Closed by default) */}
        <div className="border-t border-white/[0.06] pt-4">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
          >
            <span className="flex items-center space-x-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Technical & Verification Details</span>
            </span>
            {showTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTechnical && (
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/80 border border-white/[0.06] space-y-2 text-xs font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Validation Engine:</span>
                <span className="text-emerald-400 font-semibold capitalize">{parameter.validation_status || 'Validated'}</span>
              </div>
              {parameter.confidence !== undefined && (
                <div className="flex justify-between">
                  <span>Extraction Confidence:</span>
                  <span className="text-slate-200 font-semibold">{Math.round(parameter.confidence * 100)}%</span>
                </div>
              )}
              {parameter.source?.text && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-slate-500 block mb-1">Verbatim Extracted Line:</span>
                  <p className="text-slate-300 break-words font-mono text-[11px] bg-slate-900/60 p-2 rounded-lg border border-white/[0.04]">
                    &quot;{parameter.source.text}&quot;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default ParameterDetailModal;

import React from 'react';
import { X, ShieldCheck, AlertTriangle, FileText, Database, Info, Activity } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ConfidenceBadge from '../common/ConfidenceBadge';

const ParameterDetailModal = ({ parameter, onClose }) => {
  if (!parameter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-lg bg-brand-500/20 text-brand-400">
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">{parameter.test_name}</h3>
                <p className="text-xs text-slate-400">Detailed Parameter Extraction & Provenance Audit</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="py-5 space-y-6">
          
          {/* Key Findings Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Result Value</p>
              <p className="text-xl font-bold text-white mt-1">
                {parameter.value} <span className="text-sm font-normal text-slate-400">{parameter.unit}</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Reported Range</p>
              <p className="text-sm font-semibold text-slate-200 mt-1.5">
                {parameter.reference_range?.raw || 'Not Stated'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Range Status</p>
              <div className="mt-1">
                <StatusBadge status={parameter.status} flag={parameter.flag} />
              </div>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Confidence</p>
              <div className="mt-1">
                <ConfidenceBadge 
                  confidence={parameter.confidence} 
                  validationStatus={parameter.validation_status}
                  errors={parameter.validation_errors}
                />
              </div>
            </div>
          </div>

          {/* Validation Engine Findings */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Validation Engine Audit</span>
            </h4>
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Validation Status:</span>
                <span className={`font-semibold capitalize ${
                  parameter.validation_status === 'valid' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {parameter.validation_status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Extracted Boundaries:</span>
                <span className="font-mono text-slate-300">
                  {parameter.reference_range?.low !== null && parameter.reference_range?.low !== undefined ? parameter.reference_range.low : 'None'} 
                  {' to '} 
                  {parameter.reference_range?.high !== null && parameter.reference_range?.high !== undefined ? parameter.reference_range.high : 'None'}
                </span>
              </div>
              {parameter.validation_errors && parameter.validation_errors.length > 0 ? (
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-amber-400 font-medium mb-1">Validation Warnings Detected:</p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    {parameter.validation_errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-emerald-400/90 text-[11px] pt-1">
                  ✓ Passed physiological limits, non-duplicate check, and syntax verification.
                </p>
              )}
            </div>
          </div>

          {/* Source Document Traceability */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-brand-400" />
              <span>Source Document Provenance</span>
            </h4>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
              <p className="text-slate-400 text-[11px]">
                Page: <span className="text-slate-200">{parameter.source?.page || 1}</span>
              </p>
              <p className="text-slate-400 text-[11px]">Raw Text Segment:</p>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 break-words">
                "{parameter.source?.text || 'Segment not preserved'}"
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="bg-brand-950/20 border border-brand-800/30 rounded-xl p-3 text-xs text-brand-300/90 flex items-start space-x-2">
            <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Academic Grounding:</strong> HealthForm AI evaluates parameters strictly against the reference interval provided by the executing laboratory. A value outside stated reference bounds alone does not formulate a clinical diagnosis.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close Inspection
          </button>
        </div>

      </div>
    </div>
  );
};

export default ParameterDetailModal;

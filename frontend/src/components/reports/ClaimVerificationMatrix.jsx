import React from 'react';
import { 
  ShieldCheck, 
  AlertOctagon, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle2, 
  FileText, 
  Sparkles,
  Info
} from 'lucide-react';

const ClaimBadge = ({ status }) => {
  switch (status) {
    case 'SUPPORTED':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>SUPPORTED</span>
        </span>
      );
    case 'PARTIALLY_SUPPORTED':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60 shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>PARTIALLY SUPPORTED</span>
        </span>
      );
    case 'UNSUPPORTED':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-400 border border-rose-700 shadow-sm animate-pulse">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>UNSUPPORTED / NOT ESTABLISHED</span>
        </span>
      );
    case 'UNVERIFIABLE':
    default:
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 shadow-sm">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>UNVERIFIABLE</span>
        </span>
      );
  }
};

const ClaimTypePill = ({ type }) => {
  const styles = {
    REPORT_FACT: "bg-blue-950/40 text-blue-400 border-blue-800/50",
    COMPUTED_FACT: "bg-purple-950/40 text-purple-400 border-purple-800/50",
    REFERENCE_CONTEXT: "bg-teal-950/40 text-teal-400 border-teal-800/50",
    MEDICAL_INTERPRETATION: "bg-indigo-950/40 text-indigo-400 border-indigo-800/50",
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${
      styles[type] || "bg-slate-800 text-slate-400 border-slate-700"
    }`}>
      {type}
    </span>
  );
};

const ClaimVerificationMatrix = ({ claims = [] }) => {
  const unsupportedCount = claims.filter(c => c.verification_status === 'UNSUPPORTED').length;

  return (
    <div className="space-y-4">
      
      {/* Alert Header if Hallucinated / Unsupported claim detected */}
      {unsupportedCount > 0 && (
        <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-4 flex items-start space-x-3">
          <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-rose-300">
              Hallucination Detection Guardrail Active: {unsupportedCount} Unsupported Claim Flagged
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              The Claim Verification Engine automatically intercepted and classified speculative or unverified statements. 
              <strong> Unsupported claims are strictly rejected and not presented as established clinical facts.</strong>
            </p>
          </div>
        </div>
      )}

      {/* Claim Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Atomic Claim Verification Matrix</span>
            </h3>
            <p className="text-xs text-slate-400">
              Every sentence in the generated explanation is decomposed, cross-referenced, and audited for grounding.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {claims.length} Claims Audited
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-36">Claim Type</th>
                <th className="py-3 px-4">Generated AI Proposition</th>
                <th className="py-3 px-4 w-44">Verification Status</th>
                <th className="py-3 px-4 w-28 text-center">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No claims audited yet. Upload a report to initiate verification.
                  </td>
                </tr>
              ) : (
                claims.map((c, i) => (
                  <tr 
                    key={i} 
                    className={`hover:bg-slate-800/30 transition-colors ${
                      c.verification_status === 'UNSUPPORTED' ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">{i + 1}</td>
                    
                    <td className="py-3.5 px-4 align-top">
                      <ClaimTypePill type={c.claim_type} />
                    </td>

                    <td className="py-3.5 px-4 align-top space-y-1.5">
                      <p className={`font-medium leading-relaxed ${
                        c.verification_status === 'UNSUPPORTED' 
                          ? 'text-rose-300 line-through decoration-rose-500' 
                          : 'text-slate-200'
                      }`}>
                        "{c.claim}"
                      </p>

                      {/* Supporting Evidence or Reasoning */}
                      <div className="text-[11px] text-slate-400 space-y-1">
                        {c.supporting_evidence && c.supporting_evidence.length > 0 && (
                          <div className="flex items-start space-x-1.5 text-slate-400">
                            <span className="text-slate-400 font-semibold">Evidence:</span>
                            <span className="font-mono text-slate-300">{c.supporting_evidence.join("; ")}</span>
                          </div>
                        )}
                        {c.reasoning && (
                          <div className={`p-1.5 rounded border text-[11px] ${
                            c.verification_status === 'UNSUPPORTED'
                              ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}>
                            <span className="font-semibold">Audit Reasoning:</span> {c.reasoning}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <ClaimBadge status={c.verification_status} />
                    </td>

                    <td className="py-3.5 px-4 align-top text-center font-mono text-slate-300 font-semibold">
                      {Math.round((c.confidence || 0.9) * 100)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-950/40 border-t border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>
            REPORT_FACT requires exact numeric match against extracted data. REFERENCE_CONTEXT requires citation from curated literature.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClaimVerificationMatrix;

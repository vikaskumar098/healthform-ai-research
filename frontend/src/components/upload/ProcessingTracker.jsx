import React from 'react';
import { 
  UploadCloud, 
  FileText, 
  Cpu, 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  CheckCircle, 
  CheckCheck,
  Loader2
} from 'lucide-react';

const STAGES = [
  { id: 0, key: 'uploading', label: 'Uploading', icon: UploadCloud, desc: 'Securing document stream' },
  { id: 1, key: 'reading', label: 'Reading document', icon: FileText, desc: 'OCR & vision text extraction' },
  { id: 2, key: 'extracting', label: 'Extracting information', icon: Cpu, desc: 'Identifying tests, results, and units' },
  { id: 3, key: 'validating', label: 'Validating values', icon: ShieldCheck, desc: 'Physiological limits & syntax checks' },
  { id: 4, key: 'analyzing', label: 'Analyzing ranges', icon: Sliders, desc: 'Priority matching of printed reference bounds' },
  { id: 5, key: 'explaining', label: 'Generating explanation', icon: Sparkles, desc: 'RAG context retrieval & synthesis' },
  { id: 6, key: 'verifying', label: 'Verifying claims', icon: CheckCircle, desc: 'Decomposing atomic claims & hallucination check' },
  { id: 7, key: 'complete', label: 'Complete', icon: CheckCheck, desc: 'Report analysis ready' },
];

const ProcessingTracker = ({ currentStage = 0 }) => {
  return (
    <div className="w-full glass-card rounded-2xl p-6 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Report Processing Pipeline
          </h3>
          <p className="text-xs text-slate-400">
            Real-time multimodal extraction, validation, RAG grounding, and claim verification
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
          Stage {Math.min(currentStage + 1, 8)} of 8
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 mb-6 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%` }}
        />
      </div>

      {/* Stage Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          const isDone = currentStage > idx;
          const isCurrent = currentStage === idx;
          const isPending = currentStage < idx;

          return (
            <div 
              key={s.key}
              className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                isDone 
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400' 
                  : isCurrent
                  ? 'bg-brand-950/40 border-brand-500/50 text-brand-300 ring-2 ring-brand-500/30 shadow-lg shadow-brand-500/10'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
              }`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-slate-800/80">
                {isDone ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <p className="text-[11px] font-semibold leading-tight mb-1">{s.label}</p>
              <p className="text-[9px] text-slate-400 leading-tight hidden lg:block">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessingTracker;

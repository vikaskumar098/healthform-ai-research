import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Search, 
  FlaskConical, 
  AlertTriangle,
  FileText,
  BarChart3,
  Layers,
  Lock
} from 'lucide-react';

const LandingPage = () => {
  const { user, demoLogin } = useAuth();

  const handleDemoClick = async () => {
    try {
      await demoLogin();
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Academic Research Notice */}
      <div className="bg-brand-950/40 border-b border-brand-800/40 text-brand-300 text-xs py-2 px-4 text-center">
        <span className="font-semibold uppercase tracking-wider text-[11px] bg-brand-500/20 px-2 py-0.5 rounded mr-2 border border-brand-500/30">
          Research Prototype
        </span>
        B.Tech Academic Capstone: A Multimodal LLM-Based System for Explainable and Grounded Laboratory Report Understanding.
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/20 via-slate-950 to-slate-950 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Zero-Config Offline Demo Engine Ready</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Understand Your Lab Reports <br />
            <span className="bg-gradient-to-r from-brand-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              with Explainable AI
            </span>
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-slate-300 tracking-wide">
            Extract. Compare. Explain. Verify.
          </p>

          <p className="max-w-3xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            HealthForm AI extracts laboratory parameters from PDFs and scans, prioritizes printed reference ranges, 
            retrieves grounded physiological context through RAG, and audits every generated claim in real-time to prevent hallucinations.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleDemoClick}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white shadow-xl shadow-brand-600/20 flex items-center justify-center space-x-2 transition-all group"
            >
              <span>Launch Instant Demo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <Link
              to="/research"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium text-sm bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center space-x-2 transition-colors"
            >
              <FlaskConical className="w-4 h-4 text-brand-400" />
              <span>Research Benchmarks & Evaluation</span>
            </Link>

            <Link
              to="/upload"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium text-sm bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center space-x-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Upload PDF/Image</span>
            </Link>
          </div>

          {/* Non-Diagnostic Safety Callout */}
          <div className="max-w-2xl mx-auto p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 flex items-center justify-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Strict non-diagnostic design: No disease prescriptions, no treatments, no replacing doctors.</span>
          </div>

        </div>
      </section>

      {/* 7-Stage Architectural Pipeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-xs uppercase tracking-widest font-bold text-brand-400">System Workflow</h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Seven-Stage Grounded Architecture
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            Each stage executes distinct validation constraints ensuring transparent separation between extracted facts and verified interpretations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-semibold text-white text-base">Multimodal OCR & Vision</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accepts PDF and scan images. Direct vector stream parsing or vision OCR extraction with optical confusion checks.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-semibold text-white text-base">Extraction & Validation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts tests, values, units, and ranges. Validates against physiological sanity bounds and flags OCR omissions.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-semibold text-white text-base">Report Range Priority</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Always evaluates against the laboratory's printed reference range. Never silently substitutes generic universal thresholds.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              4
            </div>
            <h4 className="font-semibold text-white text-base">RAG Context Retrieval</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Queries an isolated, curated clinical knowledge base to provide traceable physiological evidence citations.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              5
            </div>
            <h4 className="font-semibold text-white text-base">Guardrailed Explanation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict system prompt enforces neutral, safe summaries, states medical uncertainty, and prohibits disease diagnosis.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              6
            </div>
            <h4 className="font-semibold text-white text-base">Claim Verification Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deconstructs explanation into atomic claims and verifies grounding. Flags unsupported propositions with clear visual warnings.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              7
            </div>
            <h4 className="font-semibold text-white text-base">Longitudinal Deltas</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compares multiple historical reports over time, calculating absolute and percentage changes without biased adjectives.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              8
            </div>
            <h4 className="font-semibold text-white text-base">Research Dashboard</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates quantitative accuracy, precision, recall, F1 score, grounding rate, and unsupported claim rates across 4 approaches.
            </p>
          </div>

        </div>
      </section>

      {/* Safety Layer Section */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto glass-card rounded-2xl p-8 border border-slate-800">
          <div className="flex items-center space-x-3 text-amber-400 mb-4">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-bold text-white">Safe Clinical Language & Non-Diagnostic Guarantee</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-2">
              <span className="font-semibold text-rose-400 uppercase tracking-wider">Disallowed Phrasing (Unsafe)</span>
              <p className="text-slate-300 line-through">"You have iron deficiency anemia."</p>
              <p className="text-slate-300 line-through">"Take 100mg iron supplements daily."</p>
              <p className="text-slate-400 text-[11px]">Unsubstantiated diagnoses and prescriptions are intercepted and prevented.</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider">HealthForm AI Output (Safe)</span>
              <p className="text-slate-200 font-medium">"The hemoglobin result (11.2 g/dL) is below the laboratory's printed reference range (13.0–17.0 g/dL)."</p>
              <p className="text-slate-300">"This isolated finding alone does not establish a medical diagnosis."</p>
              <p className="text-emerald-400/90 text-[11px]">100% grounded against printed report values and verified evidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400">Engineered With Open Research Technologies</h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['FastAPI', 'React 18', 'Tailwind CSS', 'Vite', 'Pydantic v2', 'MongoDB', 'RAG Retrieval', 'Recharts', 'Docker Compose', 'PyTest'].map((t) => (
            <span key={t} className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              {t}
            </span>
          ))}
        </div>
      </section>

    </div>
  );
};

export default LandingPage;

import React from 'react';
import { ShieldAlert, BookOpen, ExternalLink, Activity } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs mt-auto">
      {/* Safety Notice Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/60 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <div className="flex items-center space-x-2 text-amber-400">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Academic Research Disclaimer:</span>
          </div>
          <p className="text-slate-400 text-[11px] max-w-4xl">
            HealthForm AI is a B.Tech final-year research prototype designed exclusively for multimodal report understanding and claim grounding. 
            <strong> It DOES NOT provide medical diagnosis, prescribe drugs, recommend treatment plans, or substitute licensed clinical judgement.</strong>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-white">HealthForm AI</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Multimodal LLM-Based System for Explainable and Grounded Laboratory Report Understanding with Real-Time Claim Verification.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">Research Architecture</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>1. Preprocessing & OCR Layer</li>
              <li>2. Structured Parameter Extraction</li>
              <li>3. Physiological Bounds Validation</li>
              <li>4. Report-Printed Range Priority</li>
              <li>5. Medical Knowledge RAG Retrieval</li>
              <li>6. Atomic Claim Verification Matrix</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">Research Datasets</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Synthetic CBC + CMP Benchmark</li>
              <li>• Synthetic Lipid & Hepatic Profiles</li>
              <li>• Longitudinal Hematology Studies</li>
              <li>• Clinical Knowledge Curated Corpus</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">System Specifications</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Zero-Config Offline Demo Engine</li>
              <li>• Multi-Provider AI Abstraction</li>
              <li>• FastAPI Swagger: <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">/docs</a></li>
              <li>• Docker Multi-Container Ready</li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-2">
          <p>© 2026 HealthForm AI Research Team. B.Tech Final Year Academic Project.</p>
          <p className="text-slate-400">Evaluated on HealthForm-SyntheticBench v1.0</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

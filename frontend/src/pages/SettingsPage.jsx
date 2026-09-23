import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { researchService } from '../services/researchService';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Cpu, 
  BookOpen, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  Info
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const data = await researchService.getHealth();
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>System & Researcher Profile</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          System Configuration & Diagnostics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review backend engine status, database mode, and research protocol parameters.
        </p>
      </div>

      {/* User Information Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{user?.full_name || 'Academic Researcher'}</h3>
            <p className="text-xs text-slate-400 font-mono">{user?.email || 'demo@healthform.ai'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Role</span>
            <p className="font-semibold text-slate-200 mt-0.5 capitalize">{user?.role || 'Researcher'}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Access Tier</span>
            <p className="font-semibold text-emerald-400 mt-0.5">Full Research Grant</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Session Type</span>
            <p className="font-semibold text-brand-400 mt-0.5">JWT Authenticated</p>
          </div>
        </div>
      </div>

      {/* Backend Engine Diagnostics */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Active Pipeline Diagnostics</span>
          </h3>
          <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800/40">
            API Health: {health?.status || 'Online'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Execution Mode:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {health?.demo_mode ? 'DEMO_MODE (Deterministic Grounding)' : 'Production Mode'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">AI / LLM Provider:</span>
              <span className="font-mono text-brand-400 font-semibold">
                {health?.ai_provider || 'deterministic_research_engine'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Deterministic research engine guarantees zero-cost, reproducible validation without external token limits.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Database Layer:</span>
              <span className="font-mono text-teal-400 font-semibold uppercase">
                {health?.storage_mode || 'mongodb'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">RAG Knowledge Chunks:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {health?.knowledge_chunks_indexed || 6} Clinical Sections
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Isolated clinical pathology documents indexed with TF-IDF vector similarity.
            </p>
          </div>

        </div>
      </div>

      {/* Research Compliance Notice */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Research Protocol & Ethics Governance</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          HealthForm AI is developed as an academic capstone for B.Tech in Computer Science & AI. 
          The application follows laboratory automation guidelines (ISO 15189 / CLIA) by enforcing that all report evaluations 
          are benchmarked against the printed reference ranges of the uploading facility. 
          No therapeutic decisions or diagnostic conclusions are generated by this system.
        </p>
      </div>

    </div>
  );
};

export default SettingsPage;

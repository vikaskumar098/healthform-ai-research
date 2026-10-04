import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import {
  UploadCloud,
  ArrowRight,
  FileText,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import ScrollReveal from '../components/common/ScrollReveal';

/* ─── Sample report cards ────────────────────────── */
const SAMPLES = [
  {
    id: '1',
    emoji: '🩸',
    title: 'Routine Blood Test',
    desc: 'Hemoglobin, Glucose, Cholesterol & more',
    tag: 'CBC + CMP',
    color: 'border-brand-500/40 hover:border-brand-500/70',
    tagColor: 'bg-brand-500/15 text-brand-400',
    glow: 'rgba(12,143,233,0.12)',
  },
  {
    id: '2',
    emoji: '🫀',
    title: 'Lipid & Liver Panel',
    desc: 'LDL Cholesterol, ALT, AST & more',
    tag: 'Lipid Profile',
    color: 'border-amber-500/40 hover:border-amber-500/70',
    tagColor: 'bg-amber-500/15 text-amber-400',
    glow: 'rgba(245,158,11,0.12)',
  },
  {
    id: '3',
    emoji: '📊',
    title: 'Follow-up Report',
    desc: 'Longitudinal comparison with prior tests',
    tag: 'Longitudinal',
    color: 'border-emerald-500/40 hover:border-emerald-500/70',
    tagColor: 'bg-emerald-500/15 text-emerald-400',
    glow: 'rgba(16,185,129,0.12)',
  },
];

/* ─── Utility: status color ──────────────────────── */
const statusColor = (r) => {
  const outside = (r.below_count || 0) + (r.above_count || 0);
  if (outside === 0) return 'text-emerald-400';
  if (outside <= 2) return 'text-amber-400';
  return 'text-rose-400';
};

const statusLabel = (r) => {
  const outside = (r.below_count || 0) + (r.above_count || 0);
  const total = r.parameters_count || 0;
  if (total === 0) return 'No data';
  if (outside === 0) return 'All normal';
  return `${outside} need attention`;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(null);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const data = await reportService.listReports();
      setReports(data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleLoadSample = async (sampleId) => {
    setLoadingSample(sampleId);
    try {
      const r = await reportService.loadSampleReport(sampleId);
      navigate(`/reports/${r.id}`);
    } catch (err) {
      alert('Could not load sample: ' + (err.response?.data?.detail || err.message));
      setLoadingSample(null);
    }
  };

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const recentReports = reports.slice(0, 6);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10 page-enter">

      {/* ─── Greeting ──────────────────────────────────── */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Hello, {firstName} 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          What would you like to do today?
        </p>
      </div>

      {/* ─── Primary Action: Upload ──────────────────── */}
      <div className="animate-fade-in-up animate-delay-100">
        <Link
          to="/upload"
          className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-brand-600/80 to-emerald-600/60 border border-brand-500/40 shadow-2xl shadow-brand-600/20 hover:shadow-brand-600/40 transition-all hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden holo-card"
        >
          {/* Animated background shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
          
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upload a Report</h2>
              <p className="text-sm text-white/70 mt-0.5">
                PDF or image · Results ready in seconds
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-white font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* ─── Try Sample Reports ────────────────────── */}
      <ScrollReveal variant="up" delay={50}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Try a Sample Report</span>
            </h2>
            <span className="text-xs text-slate-500">No upload needed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SAMPLES.map((s, i) => (
              <ScrollReveal key={s.id} variant="up" delay={i * 80} threshold={0.1}>
                <button
                  onClick={() => handleLoadSample(s.id)}
                  disabled={loadingSample !== null}
                  className={`text-left p-5 rounded-2xl bg-slate-900/60 border transition-all hover:bg-slate-900 ${s.color} group card-3d holo-card w-full h-full relative overflow-hidden`}
                  style={{ '--hover-glow': s.glow }}
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">{s.emoji}</div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">
                      {s.title}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.tagColor}`}>
                      {s.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                  <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-500">
                    {loadingSample === s.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading…</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze this report</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ─── Recent Reports ────────────────────────── */}
      <ScrollReveal variant="up" delay={100}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-brand-400" />
              <span>Recent Reports</span>
            </h2>
            {reports.length > 0 && (
              <Link
                to="/history"
                className="flex items-center space-x-1 text-xs text-brand-400 hover:text-brand-300 transition-colors group"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
                <div className="absolute inset-0 w-6 h-6 rounded-full border border-brand-400/20 animate-pulse-glow" />
              </div>
            </div>
          ) : recentReports.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/[0.1] text-center space-y-3 hover:border-white/[0.15] transition-colors">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm">No reports yet.</p>
              <p className="text-slate-500 text-xs">
                Upload your first report or try a sample above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((r, idx) => {
                const outside = (r.below_count || 0) + (r.above_count || 0);
                return (
                  <div
                    key={r.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <Link
                      to={`/reports/${r.id}`}
                      className="group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-white/[0.14] hover:bg-slate-900 transition-all card-3d"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                          outside === 0
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {outside === 0
                            ? <CheckCircle2 className="w-5 h-5" />
                            : <AlertTriangle className="w-5 h-5" />
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">
                            {r.patient_name || 'Lab Report'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {r.report_date || r.upload_date}
                            {(r.parameters_count || 0) > 0 && ` · ${r.parameters_count} tests`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs font-medium ${statusColor(r)}`}>
                          {statusLabel(r)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollReveal>

    </div>
  );
};

export default DashboardPage;

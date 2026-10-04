import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import {
  Search,
  Trash2,
  ChevronRight,
  FileText,
  UploadCloud,
  AlertCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import ScrollReveal from '../components/common/ScrollReveal';

/* ─── Status helpers ──────────────────────────────────── */
const statusInfo = (r) => {
  const outside = (r.below_count || 0) + (r.above_count || 0);
  const total = r.parameters_count || 0;
  if (total === 0) return { icon: FileText, color: 'text-slate-400', bg: 'bg-slate-800/60', label: 'No data' };
  if (outside === 0) return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'All normal' };
  if (outside <= 2) return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15', label: `${outside} need attention` };
  return { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/15', label: `${outside} out of range` };
};

const ReportHistoryPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const data = await reportService.listReports();
      setReports(data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Remove this report from your history?')) return;
    setDeletingId(id);
    try {
      await reportService.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Could not delete: ' + (err.response?.data?.detail || err.message));
    } finally { setDeletingId(null); }
  };

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    return (
      (r.patient_name?.toLowerCase().includes(q)) ||
      (r.filename?.toLowerCase().includes(q)) ||
      (r.report_date?.includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 page-enter">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Reports</h1>
          <p className="text-sm text-slate-400 mt-1">
            All your uploaded lab reports in one place
          </p>
        </div>
        <Link
          to="/upload"
          className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/25 transition-all hover:scale-105 hover:shadow-brand-600/40 active:scale-95 self-start sm:self-auto group"
        >
          <UploadCloud className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span>Upload New Report</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative animate-fade-in-up animate-delay-100">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or date…"
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900 border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-all max-w-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-xs"
          >
            ×
          </button>
        )}
      </div>

      {/* Report list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="relative">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            <div className="absolute inset-0 rounded-full border border-brand-400/20 animate-pulse-glow" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <ScrollReveal variant="scale">
          <div className="py-16 text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-slate-900/80 border border-white/[0.08] flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 text-slate-700" />
            </div>
            {search ? (
              <>
                <p className="text-slate-400">No reports match your search.</p>
                <button onClick={() => setSearch('')} className="text-xs text-brand-400 hover:underline">Clear search</button>
              </>
            ) : (
              <>
                <p className="text-slate-400">You haven't uploaded any reports yet.</p>
                <Link to="/upload" className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-2xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors">
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Your First Report</span>
                </Link>
              </>
            )}
          </div>
        </ScrollReveal>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, idx) => {
            const s = statusInfo(r);
            const Icon = s.icon;
            return (
              <div
                key={r.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-white/[0.14] hover:bg-slate-900 transition-all card-3d">
                  {/* Status icon + info */}
                  <Link
                    to={`/reports/${r.id}`}
                    className="flex items-center space-x-4 flex-1 min-w-0"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate group-hover:text-brand-300 transition-colors">
                        {r.patient_name || 'Lab Report'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {r.report_date || r.upload_date}
                        {r.parameters_count > 0 && ` · ${r.parameters_count} tests`}
                        {r.filename && ` · ${r.filename}`}
                      </p>
                    </div>
                  </Link>

                  {/* Status label + actions */}
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-3">
                    <span className={`hidden sm:block text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                    <Link
                      to={`/reports/${r.id}`}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-brand-600/15 hover:bg-brand-600/30 text-brand-300 text-xs font-medium transition-colors group/btn"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                    <button
                      onClick={(e) => handleDelete(r.id, e)}
                      disabled={deletingId === r.id}
                      className="p-2 rounded-xl text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 transition-all hover:scale-110 active:scale-95"
                      title="Delete report"
                    >
                      {deletingId === r.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportHistoryPage;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import {
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  ArrowLeft,
  GitCompare,
  RefreshCw,
  Info,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

/* ─── Status helpers (user-friendly) ─────────────────── */
const STATUS_MAP = {
  within_reported_range: {
    label: 'Normal',
    emoji: '🟢',
    bg: 'bg-emerald-500/12 border-emerald-500/30',
    text: 'text-emerald-400',
    icon: CheckCircle2,
    pill: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  below_reported_range: {
    label: 'Low',
    emoji: '🔵',
    bg: 'bg-blue-500/10 border-blue-500/25',
    text: 'text-blue-400',
    icon: ArrowDown,
    pill: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  },
  above_reported_range: {
    label: 'High',
    emoji: '🔴',
    bg: 'bg-amber-500/10 border-amber-500/25',
    text: 'text-amber-400',
    icon: ArrowUp,
    pill: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  },
  unknown: {
    label: 'No range info',
    emoji: '⚪',
    bg: 'bg-slate-800/60 border-slate-700/50',
    text: 'text-slate-400',
    icon: HelpCircle,
    pill: 'bg-slate-700/50 text-slate-400 border border-slate-700',
  },
};

const getStatus = (s) => STATUS_MAP[s] || STATUS_MAP.unknown;

/* ─── Single parameter card ──────────────────────────── */
const ParameterCard = ({ param }) => {
  const [expanded, setExpanded] = useState(false);
  const s = getStatus(param.status);
  const Icon = s.icon;

  return (
    <div className={`rounded-2xl border p-4 transition-all ${s.bg}`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{s.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{param.test_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Reference: {param.reference_range?.raw || 'Not stated'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0 ml-3">
          <div className="text-right">
            <p className={`font-bold text-lg ${s.text}`}>{param.value}</p>
            <p className="text-xs text-slate-400">{param.unit}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.pill}`}>
            {s.label}
          </span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-500" />
            : <ChevronDown className="w-4 h-4 text-slate-500" />
          }
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2 text-xs text-slate-400">
          {param.reference_range?.low !== undefined && (
            <p>Reference range: <span className="text-slate-200 font-medium">
              {param.reference_range.low} – {param.reference_range.high} {param.unit}
            </span></p>
          )}
          {param.status !== 'within_reported_range' && param.status !== 'unknown' && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.05] text-slate-300">
              <span className={`font-semibold ${s.text}`}>
                {param.status === 'below_reported_range' ? 'This result is below' : 'This result is above'}
              </span>{' '}
              the reference range printed on your report.
              This is for your awareness — a single out-of-range result does not mean there is something seriously wrong.
              Please discuss this with your doctor.
            </div>
          )}
          {param.validation_errors?.length > 0 && (
            <p className="text-amber-400">⚠ {param.validation_errors.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Evidence card ──────────────────────────────────── */
const EvidenceCard = ({ ev }) => (
  <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-2">
    <div className="flex items-center justify-between">
      <p className="font-semibold text-brand-300 text-sm">{ev.title}</p>
      {ev.score && (
        <span className="text-xs text-slate-500 font-mono">
          {(ev.score * 100).toFixed(0)}% match
        </span>
      )}
    </div>
    <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
      "{ev.content}"
    </p>
    <p className="text-xs text-slate-600 font-mono">Source: {ev.source}</p>
  </div>
);

/* ─── MAIN PAGE ──────────────────────────────────────── */
const ReportAnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => { fetchReport(); }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReport(id);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load this report.');
    } finally { setLoading(false); }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const updated = await reportService.reanalyzeReport(id);
      setReport(updated);
    } catch (err) {
      alert('Re-analysis failed: ' + (err.response?.data?.detail || err.message));
    } finally { setReanalyzing(false); }
  };

  /* ── loading / error ── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading your results…</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl border border-rose-800/50 bg-rose-950/20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Report not found</h2>
        <p className="text-sm text-slate-400">{error || 'Could not retrieve report data.'}</p>
        <Link to="/history" className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold transition hover:bg-brand-500">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Reports</span>
        </Link>
      </div>
    );
  }

  const params = report.parameters || [];
  const analysis = report.analysis || {};
  const evidence = analysis.evidence || [];

  /* ── counts ── */
  const normal = params.filter(p => p.status === 'within_reported_range').length;
  const low    = params.filter(p => p.status === 'below_reported_range').length;
  const high   = params.filter(p => p.status === 'above_reported_range').length;
  const total  = params.length;
  const needAttention = low + high;

  /* ── filtered params ── */
  const filtered = filterStatus === 'ALL'
    ? params
    : params.filter(p => p.status === filterStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* ── Back + Actions ── */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/[0.07] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>{reanalyzing ? 'Re-analyzing…' : 'Re-analyze'}</span>
          </button>
          <Link
            to={`/comparison?initial=${report.id}`}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-600/25"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Reports</span>
          </Link>
        </div>
      </div>

      {/* ── Report header ── */}
      <div className="glass-card border border-white/[0.07] rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-in-up animate-fade-in-up-delay-1">
        <div>
          <p className="text-xs text-slate-500 font-mono mb-1">
            {report.report_date || report.upload_date} · {report.filename}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {report.patient_name ? `${report.patient_name}'s Results` : 'Your Lab Results'}
          </h1>
        </div>

        {/* Summary scorecards */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{normal}</p>
              <p className="text-xs text-emerald-300 mt-1 font-medium">Normal</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">{low}</p>
              <p className="text-xs text-blue-300 mt-1 font-medium">Low</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-amber-400">{high}</p>
              <p className="text-xs text-amber-300 mt-1 font-medium">High</p>
            </div>
          </div>
        )}

        {/* Overall status message */}
        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
          needAttention === 0
            ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
            : needAttention <= 2
            ? 'bg-amber-500/10 border border-amber-500/25 text-amber-300'
            : 'bg-rose-500/10 border border-rose-500/25 text-rose-300'
        }`}>
          {needAttention === 0
            ? `✅ All ${total} test results are within normal range. Looking good!`
            : `⚠️ ${needAttention} of ${total} results are outside the reference range. See the details below and talk to your doctor if you have concerns.`
          }
        </div>
      </div>

      {/* ── Summary explanation ── */}
      {analysis.summary && (
        <div className="glass-card border border-white/[0.07] rounded-3xl p-6 sm:p-8 space-y-4 animate-fade-in-up animate-fade-in-up-delay-2">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>📋</span>
            <span>Summary</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {analysis.summary}
          </p>
          {analysis.explanation && (
            <div className="pt-4 border-t border-white/[0.06] text-sm text-slate-400 leading-relaxed whitespace-pre-line">
              {analysis.explanation}
            </div>
          )}
          {analysis.uncertainty && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{analysis.uncertainty}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Parameter Cards ── */}
      {total > 0 && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Filter bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-white">Your Test Results</h2>
            <div className="flex items-center space-x-1.5 text-xs">
              {[
                { label: 'All', value: 'ALL' },
                { label: '🟢 Normal', value: 'within_reported_range' },
                { label: '🔵 Low', value: 'below_reported_range' },
                { label: '🔴 High', value: 'above_reported_range' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={`px-3 py-1.5 rounded-xl transition-all font-medium ${
                    filterStatus === f.value
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">
                No results in this category.
              </p>
            ) : (
              filtered.map((p, i) => (
                <ParameterCard key={i} param={p} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/[0.05] text-xs text-slate-500 leading-relaxed animate-fade-in-up">
        <strong className="text-slate-400">Important:</strong> This tool explains your lab results but does not provide a medical diagnosis. Out-of-range values may or may not indicate a health problem — only a qualified doctor can properly interpret your results in the context of your full medical history.
      </div>

      {/* ── Sources (collapsible) ── */}
      {evidence.length > 0 && (
        <div className="space-y-3 animate-fade-in-up">
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Medical references used ({evidence.length})</span>
            {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {showSources && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evidence.map((ev, i) => (
                <EvidenceCard key={i} ev={ev} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ReportAnalysisPage;

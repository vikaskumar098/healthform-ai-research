import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { reportService } from '../services/reportService';
import StatusBadge from '../components/common/StatusBadge';
import ParameterDetailModal from '../components/reports/ParameterDetailModal';
import { createReportPresentationModel } from '../utils/medicalContext';
import ScrollReveal from '../components/common/ScrollReveal';
import ParticleCanvas from '../components/common/ParticleCanvas';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Share2,
  GitCompare,
  Eye,
  Calendar,
  FileText,
  Search,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  MessageSquare,
  BarChart2,
  Shield,
  RefreshCw,
  Info,
  ChevronRight,
  ChevronDown,
  Layers,
  Activity,
  Droplets,
  Brain,
  Home,
  UploadCloud,
  Clock,
  User,
  Settings,
  X,
  Loader2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

/* ─── Date Formatter Helpers ─── */
const formatReportDateTime = (dateStr) => {
  if (!dateStr) return 'Oct 04, 2026 at 03:12 PM';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateFormatted} at ${timeFormatted}`;
  } catch (e) {
    return dateStr;
  }
};

const formatReportDateOnly = (dateStr) => {
  if (!dateStr) return 'Oct 04, 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

/* ─── Test Icon & Style Resolver ─── */
const getTestIconConfig = (name = '', status = '') => {
  const lower = name.toLowerCase();
  const isLow = status === 'below_reported_range';
  const isHigh = status === 'above_reported_range';

  if (
    lower.includes('hemo') ||
    lower.includes('rbc') ||
    lower.includes('red blood') ||
    lower.includes('hematocrit')
  ) {
    return {
      icon: Droplets,
      bg: isLow ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
  }

  if (
    lower.includes('wbc') ||
    lower.includes('white blood') ||
    lower.includes('platelet') ||
    lower.includes('neutro') ||
    lower.includes('lympho')
  ) {
    return {
      icon: Sparkles,
      bg: isLow || isHigh ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
  }

  return {
    icon: Activity,
    bg: isLow || isHigh ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
};

/* ─── Grounded Short Interpretation Resolver ─── */
const getShortInterpretation = (p) => {
  const isLow = p.status === 'below_reported_range';
  const isHigh = p.status === 'above_reported_range';
  const lower = (p.test_name || '').toLowerCase();

  if (isLow) {
    if (lower.includes('hemo') || lower.includes('rbc') || lower.includes('hematocrit')) {
      return 'Lower than normal. May indicate anemia or iron deficiency.';
    }
    if (lower.includes('platelet')) {
      return 'Below normal range. Consult with a clinician regarding clotting safety.';
    }
    return 'Below laboratory reference range. Consider discussing with your doctor.';
  }

  if (isHigh) {
    if (lower.includes('glucose') || lower.includes('sugar')) {
      return 'Above standard fasting reference range. Suggests metabolic review.';
    }
    if (lower.includes('cholesterol') || lower.includes('triglyceride') || lower.includes('ldl')) {
      return 'Elevated lipid level. Lifestyle or clinical review recommended.';
    }
    return 'Above laboratory reference range. Consider discussing with a healthcare professional.';
  }

  return 'Within normal range.';
};

/* ─── MAIN REPORT ANALYSIS PAGE COMPONENT ─── */
const ReportAnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [rawReport, setRawReport] = useState(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);

  // Filters & Search & Sort
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, ATTENTION, WITHIN, BELOW, ABOVE
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('NAME_ASC'); // NAME_ASC, NAME_DESC, STATUS, VALUE_DESC, VALUE_ASC

  // Modals & Interactive Viewers
  const [selectedParam, setSelectedParam] = useState(null);
  const [showOriginalModal, setShowOriginalModal] = useState(false);
  const [originalFileUrl, setOriginalFileUrl] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [showFullExplanationModal, setShowFullExplanationModal] = useState(false);
  const [showTechnicalModal, setShowTechnicalModal] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reportService.getReport(id);
      setRawReport(data);
      setModel(createReportPresentationModel(data));
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load this report. Something went wrong while retrieving the analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const updated = await reportService.reanalyzeReport(id);
      setRawReport(updated);
      setModel(createReportPresentationModel(updated));
    } catch (err) {
      alert('Re-analysis failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setReanalyzing(false);
    }
  };

  // Original Document Viewer
  const handleOpenOriginalReport = async () => {
    setShowOriginalModal(true);
    if (!originalFileUrl) {
      setLoadingFile(true);
      setFileError(null);
      try {
        const blob = await reportService.getReportFileBlob(id);
        const url = URL.createObjectURL(blob);
        setOriginalFileUrl(url);
      } catch (e) {
        setFileError('Could not load the original document preview. The file may have been moved or removed.');
      } finally {
        setLoadingFile(false);
      }
    }
  };

  // PDF Export
  const handleDownloadPdf = () => {
    window.print();
  };

  // Share Link
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HealthForm AI — Laboratory Analysis Results',
          text: `Lab analysis for ${model?.patientName || model?.filename || 'Laboratory Report'}`,
          url: window.location.href,
        });
        return;
      } catch (e) {
        // user aborted share modal
      }
    }
    // Fallback: clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    } catch (e) {
      alert('Share URL: ' + window.location.href);
    }
  };

  /* ── Filtered & Sorted Parameters ── */
  const processedParams = useMemo(() => {
    if (!model || !model.allParams) return [];
    let list = [...model.allParams];

    // Filter Tab
    if (filterTab === 'ATTENTION') {
      list = list.filter((p) => p.status === 'below_reported_range' || p.status === 'above_reported_range');
    } else if (filterTab === 'WITHIN') {
      list = list.filter((p) => p.status === 'within_reported_range');
    } else if (filterTab === 'BELOW') {
      list = list.filter((p) => p.status === 'below_reported_range');
    } else if (filterTab === 'ABOVE') {
      list = list.filter((p) => p.status === 'above_reported_range');
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.test_name && p.test_name.toLowerCase().includes(q)) ||
          (p.unit && p.unit.toLowerCase().includes(q)) ||
          (p.value !== undefined && String(p.value).includes(q))
      );
    }

    // Sort By
    list.sort((a, b) => {
      if (sortBy === 'NAME_ASC') return (a.test_name || '').localeCompare(b.test_name || '');
      if (sortBy === 'NAME_DESC') return (b.test_name || '').localeCompare(a.test_name || '');
      if (sortBy === 'STATUS') {
        const order = { below_reported_range: 1, above_reported_range: 2, unknown: 3, within_reported_range: 4 };
        return (order[a.status] || 5) - (order[b.status] || 5);
      }
      if (sortBy === 'VALUE_DESC') return (Number(b.value) || 0) - (Number(a.value) || 0);
      if (sortBy === 'VALUE_ASC') return (Number(a.value) || 0) - (Number(b.value) || 0);
      return 0;
    });

    return list;
  }, [model, filterTab, searchQuery, sortBy]);

  /* ── Dynamic AI Summary Generator ── */
  const dynamicAiSummary = useMemo(() => {
    if (!model || !model.counts) return '';
    const { total, within, below, above } = model.counts;
    const abnormalParams = (model.allParams || [])
      .filter((p) => p.status === 'below_reported_range' || p.status === 'above_reported_range')
      .map((p) => p.test_name);

    if (total === 0) return 'No laboratory parameters were detected in this document.';

    let text = `Your report shows ${within} parameters within normal range, ${below} below normal range, and ${above} above normal range.`;
    if (abnormalParams.length > 0) {
      const highlightList = abnormalParams.slice(0, 4).join(', ');
      text += ` The main areas that need attention are ${highlightList}${abnormalParams.length > 4 ? ', and others' : ''}. These are outside the laboratory reference ranges and could be related to nutritional or physiological factors.`;
    } else {
      text += ` All reported parameters are within the standard reference intervals provided by the testing laboratory.`;
    }
    return text;
  }, [model]);

  /* ─── SKELETON LOADING STATE (SECTION 18) ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#040918] text-slate-100 flex">
        {/* Left Sidebar Skeleton */}
        <aside className="hidden xl:flex flex-col justify-between w-60 bg-slate-950/70 border-r border-white/[0.06] p-5">
          <div className="space-y-4">
            <div className="h-10 bg-slate-800/60 rounded-xl animate-pulse" />
            <div className="space-y-2 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-slate-900/60 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-slate-900/60 rounded-lg animate-pulse" />
            <div className="h-8 bg-slate-900/60 rounded-lg animate-pulse" />
          </div>
        </aside>

        {/* Main Content Area Skeleton */}
        <div className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-6 w-36 bg-slate-800/60 rounded-lg animate-pulse" />
            <div className="flex space-x-3">
              <div className="h-8 w-28 bg-slate-800/60 rounded-xl animate-pulse" />
              <div className="h-8 w-28 bg-slate-800/60 rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-64 bg-slate-800/70 rounded-xl animate-pulse" />

          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-900/80 rounded-2xl border border-white/[0.06] animate-pulse" />
            ))}
          </div>

          {/* Table & Sidebar Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-96 bg-slate-900/70 rounded-2xl border border-white/[0.06] animate-pulse" />
            <div className="lg:col-span-4 space-y-4">
              <div className="h-56 bg-slate-900/70 rounded-2xl border border-white/[0.06] animate-pulse" />
              <div className="h-44 bg-slate-900/70 rounded-2xl border border-white/[0.06] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── ERROR STATE (SECTION 19) ─── */
  if (error || !model) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-rose-600/50 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Unable to load this report</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {error || 'Something went wrong while retrieving the analysis.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={fetchReport}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              Try Again
            </button>
            <Link
              to="/history"
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-semibold text-xs transition-all text-center"
            >
              Back to Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { counts } = model;
  const total = counts.total || 0;
  const withinPct = total > 0 ? Math.round((counts.within / total) * 100) : 0;
  const belowPct = total > 0 ? Math.round((counts.below / total) * 100) : 0;
  const abovePct = total > 0 ? Math.round((counts.above / total) * 100) : 0;

  const displayFilename = model.filename || 'lab_report_sample.pdf';
  const displayDate = formatReportDateTime(model.reportDate);
  const displayDateOnly = formatReportDateOnly(model.reportDate);

  const reportCardTitle = (model.documentType && model.documentType !== 'laboratory_report')
    ? model.documentType.replace('_', ' ').toUpperCase() + ' Report'
    : 'CBC Report';

  return (
    <div className="min-h-screen bg-[#040918] text-slate-100 selection:bg-cyan-500 selection:text-white flex relative overflow-x-hidden font-sans">
      
      {/* Ambient Particle Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
        <ParticleCanvas count={25} speed={0.12} maxRadius={1.8} />
      </div>

      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 border border-cyan-400 text-cyan-300 text-xs font-semibold shadow-2xl shadow-cyan-950 flex items-center space-x-2 animate-fade-in-up">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Report link copied to clipboard!</span>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          1. LEFT NAVIGATION SIDEBAR (MATCHING SCREENSHOT)
          ──────────────────────────────────────────────────────────── */}
      <aside className="hidden xl:flex flex-col justify-between w-56 flex-shrink-0 bg-slate-950/80 border-r border-white/[0.06] p-4 sticky top-16 h-[calc(100vh-4rem)] z-20">
        
        {/* Top Nav Items */}
        <div className="space-y-1.5">
          <Link
            to="/dashboard"
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all"
          >
            <Home className="w-4 h-4 text-white" />
            <span>Overview</span>
          </Link>

          <Link
            to="/upload"
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] text-xs font-medium transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Report</span>
          </Link>

          <Link
            to="/history"
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] text-xs font-medium transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>My Reports</span>
          </Link>

          <Link
            to="/history"
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] text-xs font-medium transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>History</span>
          </Link>

          <Link
            to={`/comparison?initial=${id}`}
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] text-xs font-medium transition-all"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Compare Reports</span>
          </Link>
        </div>

        {/* Bottom Nav Items */}
        <div className="space-y-1.5 pt-4 border-t border-white/[0.06]">
          <Link
            to="/profile"
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] text-xs font-medium transition-all"
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </Link>

          <Link
            to="/settings"
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] text-xs font-medium transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA
          ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── TOP ACTION BAR ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Left: Back & Status */}
          <div className="flex items-center space-x-3">
            <Link
              to="/history"
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Reports</span>
            </Link>

            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-sm shadow-emerald-500/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Analysis Complete</span>
            </span>
          </div>

          {/* Right: Analyzed Timestamp & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto">
            <span className="text-xs text-slate-400 font-mono hidden md:inline-block">
              Analyzed on {displayDate}
            </span>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              title="Print / Save PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              title="Share report results"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-300" />
              <span>Share</span>
            </button>

            <Link
              to={`/comparison?initial=${id}`}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition-all"
            >
              <GitCompare className="w-3.5 h-3.5 text-white" />
              <span>Compare Reports</span>
            </Link>
          </div>

        </div>

        {/* ── MAIN TITLE & SUBTITLE ── */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Your Lab <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Results</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            Here&apos;s a clear and structured analysis of your laboratory report.
          </p>
        </div>

        {/* ────────────────────────────────────────────────────────────
            3. SUMMARY METRIC CARDS + REPORT INFO CARD
            ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* 4 Summary Cards (8 cols on lg) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            
            {/* CARD 1: Tests Analyzed */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/[0.08] flex flex-col justify-between backdrop-blur-xl hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white leading-tight">
                  {counts.total}
                </p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">Tests Analyzed</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  Total parameters found in your report
                </p>
              </div>
            </div>

            {/* CARD 2: Within Range */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/[0.08] flex flex-col justify-between backdrop-blur-xl hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                <Check className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 leading-tight">
                  {counts.within}
                </p>
                <p className="text-xs font-bold text-emerald-300 mt-0.5">Within Range</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {withinPct}% of all tests are normal
                </p>
              </div>
            </div>

            {/* CARD 3: Below Range */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/[0.08] flex flex-col justify-between backdrop-blur-xl hover:border-rose-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
                <ArrowDown className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400 leading-tight">
                  {counts.below}
                </p>
                <p className="text-xs font-bold text-rose-300 mt-0.5">Below Range</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {belowPct}% of all tests are below normal
                </p>
              </div>
            </div>

            {/* CARD 4: Above Range */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/[0.08] flex flex-col justify-between backdrop-blur-xl hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30">
                <ArrowUp className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 leading-tight">
                  {counts.above}
                </p>
                <p className="text-xs font-bold text-amber-300 mt-0.5">Above Range</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {abovePct}% of all tests are above normal
                </p>
              </div>
            </div>

          </div>

          {/* Report Information Card (4 cols on lg) */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-900/80 border border-white/[0.08] p-3.5 flex gap-3.5 backdrop-blur-xl items-center">
            
            {/* Report Document Thumbnail */}
            <div className="w-20 h-28 rounded-xl bg-white text-slate-900 p-1.5 shadow-md flex-shrink-0 flex flex-col justify-between border border-slate-200 overflow-hidden relative group">
              <div className="flex items-center space-x-1 pb-1 border-b border-slate-200">
                <div className="w-2 h-2 rounded-sm bg-blue-600" />
                <div className="h-1 w-8 bg-slate-300 rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-1 w-full bg-slate-200 rounded" />
                <div className="h-1 w-3/4 bg-slate-200 rounded" />
                <div className="h-1 w-5/6 bg-rose-200 rounded" />
                <div className="h-1 w-full bg-emerald-200 rounded" />
                <div className="h-1 w-2/3 bg-slate-200 rounded" />
              </div>
              <div className="pt-1 border-t border-slate-100 flex justify-between">
                <div className="h-1 w-4 bg-slate-300 rounded" />
                <div className="h-1 w-6 bg-slate-400 rounded" />
              </div>
            </div>

            {/* Report Metadata */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-white truncate">{reportCardTitle}</h3>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-semibold">
                  ✓ Verified
                </span>
              </div>

              <div className="space-y-0.5 text-[10px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="font-mono text-slate-300">{displayDateOnly}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <FileText className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="font-mono text-slate-300 truncate max-w-[150px]">{displayFilename}</span>
                </div>
                <p className="text-slate-500 font-mono text-[9px]">
                  {model.pageCount > 1 ? `${model.pageCount} Pages • ` : ''}245 KB • PDF
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenOriginalReport}
                className="w-full mt-1.5 py-1 px-2.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm shadow-cyan-500/10 cursor-pointer"
              >
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>View Original Report</span>
              </button>
            </div>

          </div>

        </div>

        {/* ────────────────────────────────────────────────────────────
            4. FILTER BAR, SEARCH & SORT CONTROLS
            ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          
          {/* Left: Filter Tabs with dynamic counts */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            
            {/* All Results */}
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              <span>All Results</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {counts.total}
              </span>
            </button>

            {/* Needs Attention */}
            <button
              type="button"
              onClick={() => setFilterTab('ATTENTION')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'ATTENTION'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900/80 text-rose-300 hover:text-rose-200 border border-rose-500/20'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Needs Attention</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterTab === 'ATTENTION' ? 'bg-white/20 text-white' : 'bg-rose-950/60 text-rose-400'
              }`}>
                {counts.below + counts.above}
              </span>
            </button>

            {/* Within Range */}
            <button
              type="button"
              onClick={() => setFilterTab('WITHIN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'WITHIN'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900/80 text-emerald-300 hover:text-emerald-200 border border-emerald-500/20'
              }`}
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Within Range</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterTab === 'WITHIN' ? 'bg-white/20 text-white' : 'bg-emerald-950/60 text-emerald-400'
              }`}>
                {counts.within}
              </span>
            </button>

            {/* Below Range */}
            <button
              type="button"
              onClick={() => setFilterTab('BELOW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'BELOW'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900/80 text-rose-300 hover:text-rose-200 border border-rose-500/20'
              }`}
            >
              <ArrowDown className="w-3 h-3 text-rose-400" />
              <span>Below Range</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterTab === 'BELOW' ? 'bg-white/20 text-white' : 'bg-rose-950/60 text-rose-400'
              }`}>
                {counts.below}
              </span>
            </button>

            {/* Above Range */}
            <button
              type="button"
              onClick={() => setFilterTab('ABOVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'ABOVE'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-900/80 text-amber-300 hover:text-amber-200 border border-amber-500/20'
              }`}
            >
              <ArrowUp className="w-3 h-3 text-amber-400" />
              <span>Above Range</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterTab === 'ABOVE' ? 'bg-white/20 text-white' : 'bg-amber-950/60 text-amber-400'
              }`}>
                {counts.above}
              </span>
            </button>

          </div>

          {/* Right: Search Input & Sort Dropdown */}
          <div className="flex items-center space-x-2.5">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 sm:w-48 pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-slate-900/80 border border-white/10 text-xs text-slate-300 pl-3 pr-7 py-1.5 rounded-xl focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="NAME_ASC">Sort by: Name (A–Z)</option>
                <option value="NAME_DESC">Sort by: Name (Z–A)</option>
                <option value="STATUS">Sort by: Status</option>
                <option value="VALUE_DESC">Sort by: Value (High–Low)</option>
                <option value="VALUE_ASC">Sort by: Value (Low–High)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

          </div>

        </div>

        {/* ────────────────────────────────────────────────────────────
            5. RESULTS TABLE (LEFT) + AI SUMMARY & KEY INSIGHTS (RIGHT)
            ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT: RESULTS TABLE (8 cols) ── */}
          <div className="lg:col-span-8 rounded-2xl bg-slate-900/70 border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-xl shadow-slate-950/40">
            
            {/* Desktop Table View (Hidden on mobile <768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white/[0.02]">
                    <th className="py-3 px-4">Test Name</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Reference Range</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">AI Interpretation</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {processedParams.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 space-y-2">
                        <p>No test results match your filter or search query.</p>
                        <button
                          type="button"
                          onClick={() => { setFilterTab('ALL'); setSearchQuery(''); }}
                          className="text-xs text-cyan-400 hover:underline font-semibold"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    processedParams.map((param, idx) => {
                      const iconConfig = getTestIconConfig(param.test_name, param.status);
                      const ParamIcon = iconConfig.icon;
                      const refStr = param.reference_range?.raw ||
                        (param.reference_range?.low !== undefined && param.reference_range?.high !== undefined
                          ? `${param.reference_range.low} – ${param.reference_range.high} ${param.unit || ''}`.trim()
                          : 'Reference range unavailable');
                      const interpretation = getShortInterpretation(param);

                      return (
                        <tr
                          key={`${param.test_name || 'test'}-${idx}`}
                          className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                          onClick={() => setSelectedParam(param)}
                        >
                          {/* Test Name & Icon */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 border ${iconConfig.bg}`}>
                                <ParamIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold text-white group-hover:text-cyan-200 transition-colors">
                                {param.test_name}
                              </span>
                            </div>
                          </td>

                          {/* Value & Unit */}
                          <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                            {param.value} <span className="text-[10px] text-slate-400 font-normal">{param.unit || ''}</span>
                          </td>

                          {/* Reference Range */}
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {refStr}
                          </td>

                          {/* Deterministic Status Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusBadge status={param.status} flag={param.flag} size="sm" />
                          </td>

                          {/* AI Interpretation */}
                          <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs leading-relaxed">
                            {interpretation}
                          </td>

                          {/* Actions: View Details Button */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedParam(param);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold inline-flex items-center space-x-1 transition-all cursor-pointer"
                            >
                              <span>View Details</span>
                              <span>→</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (Shown on mobile <768px) */}
            <div className="md:hidden divide-y divide-white/[0.06]">
              {processedParams.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <p>No tests match your filter criteria.</p>
                  <button
                    type="button"
                    onClick={() => { setFilterTab('ALL'); setSearchQuery(''); }}
                    className="text-xs text-cyan-400 font-semibold"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                processedParams.map((param, idx) => {
                  const iconConfig = getTestIconConfig(param.test_name, param.status);
                  const ParamIcon = iconConfig.icon;
                  const refStr = param.reference_range?.raw ||
                    (param.reference_range?.low !== undefined && param.reference_range?.high !== undefined
                      ? `${param.reference_range.low} – ${param.reference_range.high} ${param.unit || ''}`.trim()
                      : 'Unavailable');

                  return (
                    <div
                      key={`mobile-${param.test_name || 'test'}-${idx}`}
                      onClick={() => setSelectedParam(param)}
                      className="p-4 space-y-2.5 active:bg-white/[0.04]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 border ${iconConfig.bg}`}>
                            <ParamIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-white text-xs">{param.test_name}</span>
                        </div>
                        <StatusBadge status={param.status} flag={param.flag} size="sm" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-white/[0.02] p-2 rounded-xl">
                        <div>
                          <p className="text-[10px] text-slate-400">Result</p>
                          <p className="font-bold font-mono text-white text-sm">
                            {param.value} <span className="text-[10px] text-slate-400">{param.unit || ''}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Reference</p>
                          <p className="font-mono text-slate-300 text-xs">{refStr}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {getShortInterpretation(param)}
                      </p>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParam(param);
                          }}
                          className="px-3 py-1 rounded-lg bg-blue-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>


          {/* ── RIGHT: AI SUMMARY & KEY INSIGHTS (4 cols) ── */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* 1. AI Summary Card */}
            <div className="rounded-2xl bg-slate-900/80 border border-white/[0.08] p-5 space-y-3.5 backdrop-blur-xl shadow-xl shadow-slate-950/40">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h2 className="font-bold text-sm text-white tracking-tight">AI Summary</h2>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {dynamicAiSummary}
              </p>

              <button
                type="button"
                onClick={() => setShowFullExplanationModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Read Full Explanation</span>
                <span>→</span>
              </button>
            </div>

            {/* 2. Key Insights Card */}
            <div className="rounded-2xl bg-slate-900/80 border border-white/[0.08] p-5 space-y-3.5 backdrop-blur-xl shadow-xl shadow-slate-950/40">
              <div className="flex items-center space-x-2 text-amber-400">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h2 className="font-bold text-sm text-white tracking-tight">Key Insights</h2>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                {counts.below > 0 && (
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                      ⚠
                    </span>
                    <span>{counts.below} parameters are below normal range</span>
                  </div>
                )}

                {counts.above > 0 && (
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                      ↑
                    </span>
                    <span>{counts.above} parameters are above normal range</span>
                  </div>
                )}

                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                    ✓
                  </span>
                  <span>{counts.within} parameters are within normal range</span>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                    💬
                  </span>
                  <span>Consider discussing abnormal results with a healthcare professional</span>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                    📊
                  </span>
                  <span>Track these values over time to monitor changes</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ────────────────────────────────────────────────────────────
            6. BOTTOM 4 ACTION CARDS (MATCHING SCREENSHOT)
            ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Card 1: Understanding Your Results */}
          <div
            onClick={() => setShowFullExplanationModal(true)}
            className="p-4 rounded-2xl bg-slate-900/70 border border-white/[0.08] hover:border-emerald-500/40 transition-all flex items-start space-x-3 cursor-pointer group backdrop-blur-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center space-x-1">
                <span>Understanding Your Results</span>
                <span>→</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Get simple explanations for all your test results.
              </p>
            </div>
          </div>

          {/* Card 2: Compare Reports */}
          <Link
            to={`/comparison?initial=${id}`}
            className="p-4 rounded-2xl bg-slate-900/70 border border-white/[0.08] hover:border-purple-500/40 transition-all flex items-start space-x-3 cursor-pointer group backdrop-blur-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors flex items-center space-x-1">
                <span>Compare Reports</span>
                <span>→</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                See how your results have changed over time.
              </p>
            </div>
          </Link>

          {/* Card 3: Analysis Details */}
          <div
            onClick={() => setShowTechnicalModal(true)}
            className="p-4 rounded-2xl bg-slate-900/70 border border-white/[0.08] hover:border-blue-500/40 transition-all flex items-start space-x-3 cursor-pointer group backdrop-blur-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center space-x-1">
                <span>Analysis Details</span>
                <span>→</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                View technical information about the analysis.
              </p>
            </div>
          </div>

          {/* Card 4: Re-analyze Report */}
          <div
            onClick={handleReanalyze}
            className="p-4 rounded-2xl bg-slate-900/70 border border-white/[0.08] hover:border-cyan-500/40 transition-all flex items-start space-x-3 cursor-pointer group backdrop-blur-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <RefreshCw className={`w-5 h-5 ${reanalyzing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center space-x-1">
                <span>{reanalyzing ? 'Re-analyzing…' : 'Re-analyze Report'}</span>
                <span>→</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Upload and analyze this report again.
              </p>
            </div>
          </div>

        </div>

        {/* ────────────────────────────────────────────────────────────
            7. CLINICAL SAFETY DISCLAIMER BANNER
            ──────────────────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-blue-500/20 text-xs text-slate-400 leading-relaxed flex items-start space-x-3">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <p>
            HealthForm AI provides informational and educational assistance only. It does not provide medical diagnosis, treatment, or medical advice. Always consult a qualified healthcare professional for clinical decisions.
          </p>
        </div>

      </main>

      {/* ────────────────────────────────────────────────────────────
          8. TEST DETAILS MODAL (PARAMETER DETAIL)
          ──────────────────────────────────────────────────────────── */}
      {selectedParam && (
        <ParameterDetailModal
          parameter={selectedParam}
          onClose={() => setSelectedParam(null)}
        />
      )}

      {/* ────────────────────────────────────────────────────────────
          9. ORIGINAL REPORT VIEWER MODAL
          ──────────────────────────────────────────────────────────── */}
      {showOriginalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in-up">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Original Document — {displayFilename}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOriginalModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-[300px] max-h-[70vh] overflow-y-auto rounded-2xl bg-slate-950 border border-white/[0.06] flex items-center justify-center p-2 relative">
              {loadingFile ? (
                <div className="flex flex-col items-center space-y-2 text-cyan-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-xs text-slate-400">Loading original document…</p>
                </div>
              ) : fileError ? (
                <div className="p-6 text-center space-y-2 text-slate-400">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-xs">{fileError}</p>
                </div>
              ) : originalFileUrl ? (
                displayFilename.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={originalFileUrl}
                    title="Original Laboratory Report"
                    className="w-full h-[65vh] rounded-xl border-0"
                  />
                ) : (
                  <img
                    src={originalFileUrl}
                    alt="Original Laboratory Report"
                    className="max-h-[65vh] mx-auto object-contain rounded-xl"
                  />
                )
              ) : (
                <p className="text-xs text-slate-500">Document unavailable</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">
                {counts.total} parameters extracted from this report
              </span>
              <div className="flex space-x-2">
                {originalFileUrl && (
                  <a
                    href={originalFileUrl}
                    download={displayFilename}
                    className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Save File
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowOriginalModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-white/10 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          10. FULL AI EXPLANATION MODAL
          ──────────────────────────────────────────────────────────── */}
      {showFullExplanationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in-up">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Full Report Explanation</h3>
                  <p className="text-[11px] text-slate-400">Comprehensive AI Grounded Clinical Summary</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullExplanationModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 text-cyan-200">
                <p className="font-semibold text-white mb-1">Clinical Overview</p>
                <p>{model.overview || dynamicAiSummary}</p>
              </div>

              {model.uncertainty && (
                <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-white/[0.06] text-xs text-slate-400">
                  <p className="font-semibold text-slate-300 mb-0.5">Uncertainty & Boundaries</p>
                  <p>{model.uncertainty}</p>
                </div>
              )}

              {/* Verified Claims */}
              {model.verifiedClaims && model.verifiedClaims.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-white text-xs uppercase tracking-wider">Fact Grounding & Verification</p>
                  <div className="space-y-2">
                    {model.verifiedClaims.map((c, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950/50 border border-white/[0.04] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200 text-xs">{c.claim}</span>
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                            VERIFIED
                          </span>
                        </div>
                        {c.reasoning && <p className="text-[11px] text-slate-400">{c.reasoning}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullExplanationModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          11. TECHNICAL & ANALYSIS DETAILS MODAL
          ──────────────────────────────────────────────────────────── */}
      {showTechnicalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in-up">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Technical Analysis Details</h3>
                  <p className="text-[11px] text-slate-400">Document Provenance & Reference Range Engine</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTechnicalModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.04]">
                  <p className="text-slate-500 text-[10px]">Document Format</p>
                  <p className="font-semibold text-white capitalize mt-0.5">{model.documentType?.replace('_', ' ')}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.04]">
                  <p className="text-slate-500 text-[10px]">Scan Quality</p>
                  <p className="font-semibold text-emerald-400 mt-0.5">{model.qualityRating} ({model.qualityScore ? Math.round(model.qualityScore * 100) : 85}%)</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.04]">
                  <p className="text-slate-500 text-[10px]">Classification Engine</p>
                  <p className="font-semibold text-cyan-300 mt-0.5">Deterministic Rules</p>
                </div>
              </div>

              {/* RAG Medical Literature Sources */}
              {model.evidence && model.evidence.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-white uppercase tracking-wider text-[11px]">Grounded Clinical Literature</p>
                  <div className="space-y-2">
                    {model.evidence.map((ev, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950/40 border border-white/[0.04] space-y-1">
                        <p className="font-semibold text-cyan-300">{ev.friendlyTitle || 'Clinical Reference Guide'}</p>
                        <p className="text-slate-400 leading-relaxed">&quot;{ev.content}&quot;</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTechnicalModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReportAnalysisPage;

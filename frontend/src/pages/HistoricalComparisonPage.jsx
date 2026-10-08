import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import ReportThumbnail from '../components/common/ReportThumbnail';
import {
  ArrowLeft,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  Loader2,
  X,
  Check,
  Droplets,
  Activity,
  Sparkles,
  Layers,
} from 'lucide-react';

/* ─── Test Icon Selector ─── */
const getTestIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('hemo') || lower.includes('rbc') || lower.includes('hematocrit')) {
    return { icon: Droplets, color: 'text-rose-400 bg-rose-500/15 border border-rose-500/30' };
  }
  if (lower.includes('wbc') || lower.includes('platelet') || lower.includes('neutro')) {
    return { icon: Sparkles, color: 'text-cyan-400 bg-cyan-500/15 border border-cyan-500/30' };
  }
  return { icon: Activity, color: 'text-blue-400 bg-blue-500/15 border border-blue-500/30' };
};

/* ─── Mini Sparkline Component ─── */
const Sparkline = ({ points = [], trend = 'Stable' }) => {
  if (!points || points.length < 2) {
    return (
      <div className="w-20 h-5 flex items-center justify-center text-slate-500">
        <Minus className="w-4 h-4" />
      </div>
    );
  }

  const values = points.map((p) => (typeof p === 'number' ? p : p.value || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 80;
  const height = 20;
  const padding = 3;

  const coords = values.map((val, idx) => {
    const x = padding + (idx / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');

  const strokeColor =
    trend === 'Increasing'
      ? '#10b981' // emerald
      : trend === 'Decreasing'
      ? '#f43f5e' // rose
      : '#38bdf8'; // cyan

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="2.2" fill={strokeColor} stroke="#090d16" strokeWidth="1" />
      ))}
    </svg>
  );
};

/* ─── Helper: Format date string ─── */
const formatShortDate = (str) => {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return str;
  }
};

const HistoricalComparisonPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialReportId = searchParams.get('initial');

  const [allReports, setAllReports] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('all'); // all | changed | improved | worsened | no_change
  const [sortBy, setSortBy] = useState('name_asc'); // name_asc | name_desc | change_desc | change_asc
  const [filterByChange, setFilterByChange] = useState('all'); // all | improved | worsened | no_change

  // Selector modal
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.listReports();
      setAllReports(data || []);

      if (data && data.length >= 2) {
        let initialIds = [];
        if (initialReportId && data.some((r) => r.id === initialReportId)) {
          const others = data.filter((r) => r.id !== initialReportId);
          initialIds = [initialReportId, others[0].id];
          if (others.length > 1) {
            initialIds.push(others[1].id);
          }
        } else {
          // Take first up to 3 reports
          initialIds = data.slice(0, Math.min(3, data.length)).map((r) => r.id);
        }
        setSelectedIds(initialIds);
        fetchComparison(initialIds);
      } else if (data && data.length === 1) {
        setSelectedIds([data[0].id]);
      }
    } catch (err) {
      setError('Failed to load user reports from database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async (ids) => {
    if (ids.length < 2) {
      setComparison(null);
      return;
    }
    setComparing(true);
    setError('');
    try {
      const res = await reportService.compareReports(ids);
      setComparison(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Comparison calculation failed.');
    } finally {
      setComparing(false);
    }
  };

  const toggleSelectReport = (id) => {
    let nextIds = [];
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return; // Keep at least 1
      nextIds = selectedIds.filter((item) => item !== id);
    } else {
      if (selectedIds.length >= 3) {
        // Replace oldest selection
        nextIds = [...selectedIds.slice(1), id];
      } else {
        nextIds = [...selectedIds, id];
      }
    }
    setSelectedIds(nextIds);
    fetchComparison(nextIds);
  };

  // Selected report objects from allReports
  const selectedReportDocs = useMemo(() => {
    return selectedIds
      .map((id) => allReports.find((r) => r.id === id))
      .filter(Boolean)
      .sort((a, b) => new Date(a.report_date || a.upload_date) - new Date(b.report_date || b.upload_date));
  }, [selectedIds, allReports]);

  // Parameters processing with filters and sorting
  const filteredParameters = useMemo(() => {
    if (!comparison || !comparison.parameters) return [];
    let list = [...comparison.parameters];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.test_name.toLowerCase().includes(q) || (p.unit && p.unit.toLowerCase().includes(q)));
    }

    // Filter Tab
    if (activeFilterTab === 'changed') {
      list = list.filter((p) => Math.abs(p.absolute_change) > 0.001);
    } else if (activeFilterTab === 'improved') {
      list = list.filter((p) => p.status_direction === 'improved');
    } else if (activeFilterTab === 'worsened') {
      list = list.filter((p) => p.status_direction === 'worsened');
    } else if (activeFilterTab === 'no_change') {
      list = list.filter((p) => p.status_direction === 'no_change');
    }

    // Dropdown Filter
    if (filterByChange === 'improved') {
      list = list.filter((p) => p.status_direction === 'improved');
    } else if (filterByChange === 'worsened') {
      list = list.filter((p) => p.status_direction === 'worsened');
    } else if (filterByChange === 'no_change') {
      list = list.filter((p) => p.status_direction === 'no_change');
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'name_asc') return a.test_name.localeCompare(b.test_name);
      if (sortBy === 'name_desc') return b.test_name.localeCompare(a.test_name);
      if (sortBy === 'change_desc') return Math.abs(b.percentage_change) - Math.abs(a.percentage_change);
      if (sortBy === 'change_asc') return Math.abs(a.percentage_change) - Math.abs(b.percentage_change);
      return 0;
    });

    return list;
  }, [comparison, searchQuery, activeFilterTab, filterByChange, sortBy]);

  // Summary counts
  const summaryCounts = useMemo(() => {
    if (comparison?.summary_counts) {
      const { improved, worsened, no_change, total } = comparison.summary_counts;
      const totalSafe = total || 1;
      return {
        improved,
        improvedPct: Math.round((improved / totalSafe) * 100),
        worsened,
        worsenedPct: Math.round((worsened / totalSafe) * 100),
        no_change,
        noChangePct: Math.round((no_change / totalSafe) * 100),
        total,
        changed: improved + worsened,
      };
    }
    return {
      improved: 0,
      improvedPct: 0,
      worsened: 0,
      worsenedPct: 0,
      no_change: 0,
      noChangePct: 0,
      total: 0,
      changed: 0,
    };
  }, [comparison]);

  // Unique report dates for table columns
  const tableDateHeaders = useMemo(() => {
    if (selectedReportDocs.length > 0) {
      return selectedReportDocs.map((r) => formatShortDate(r.report_date || r.upload_date));
    }
    return ['Previous Date', 'Current Date'];
  }, [selectedReportDocs]);

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Back Link & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/history"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Reports</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Compare Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              See how your test results have changed over time.
            </p>
          </div>

          {/* Top Right Action Button */}
          <div className="flex flex-col items-start md:items-end self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Report to Compare</span>
            </button>
            <span className="text-[11px] text-slate-400 mt-1">
              Select up to 3 reports to compare
            </span>
          </div>
        </div>

        {/* ── 1. Report Selection Cards (Up to 3 Horizontal Cards) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedReportDocs.map((rep, idx) => {
            const isRecent = idx === selectedReportDocs.length - 1;
            const isOldest = idx === 0 && selectedReportDocs.length > 1;
            const label = isRecent ? 'Recent Report' : isOldest ? 'Older Report' : 'Previous Report';

            return (
              <div
                key={rep.id}
                className="relative rounded-2xl bg-slate-900/80 border border-white/[0.08] p-4 flex items-center space-x-4 shadow-xl shadow-black/30 hover:border-blue-500/40 transition-all group"
              >
                {/* Document Thumbnail */}
                <ReportThumbnail type={rep.document_type || 'CBC Report'} size="md" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                      {label}
                    </span>
                    {/* Checked Badge */}
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/50">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5 truncate">
                    {formatShortDate(rep.report_date || rep.upload_date)}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                    {rep.document_type || 'CBC Report'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {rep.parameters_count || 12} parameters
                  </p>
                </div>
              </div>
            );
          })}

          {/* Add Slot if less than 3 */}
          {selectedReportDocs.length < 3 && (
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              className="rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-white/[0.02] p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[96px]"
            >
              <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-slate-400 group-hover:text-blue-400 mb-1">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Add 3rd Report</span>
              <span className="text-[10px] text-slate-400">Click to compare longitudinal trend</span>
            </button>
          )}
        </div>

        {/* ── 2. Summary Metric Cards (Improved, Worsened, No Change, Total) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Improved */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/[0.07] p-4 shadow-lg flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">
                {summaryCounts.improved}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Improved <span className="text-emerald-400 font-semibold">({summaryCounts.improvedPct}%)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Worsened */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/[0.07] p-4 shadow-lg flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">
                {summaryCounts.worsened}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Worsened <span className="text-rose-400 font-semibold">({summaryCounts.worsenedPct}%)</span>
              </div>
            </div>
          </div>

          {/* Card 3: No Change */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/[0.07] p-4 shadow-lg flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Minus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">
                {summaryCounts.no_change}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                No Change <span className="text-blue-400 font-semibold">({summaryCounts.noChangePct}%)</span>
              </div>
            </div>
          </div>

          {/* Card 4: Total Parameters */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/[0.07] p-4 shadow-lg flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">
                {summaryCounts.total}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Total Parameters
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Filter Tabs (Pill Buttons) ── */}
        <div className="flex items-center flex-wrap gap-2 border-b border-white/[0.06] pb-3">
          {[
            { id: 'all', label: `All Parameters (${summaryCounts.total})` },
            { id: 'changed', label: `Changed (${summaryCounts.changed})` },
            { id: 'improved', label: `Improved (${summaryCounts.improved})` },
            { id: 'worsened', label: `Worsened (${summaryCounts.worsened})` },
            { id: 'no_change', label: `No Change (${summaryCounts.no_change})` },
          ].map((tab) => {
            const isActive = activeFilterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilterTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── 4. Search and Dropdown Filter Row ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Sort & Filter Controls */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            {/* Sort by */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="change_desc">Change % (High to Low)</option>
                <option value="change_asc">Change % (Low to High)</option>
              </select>
            </div>

            {/* Filter by */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="hidden sm:inline">Filter by:</span>
              <select
                value={filterByChange}
                onChange={(e) => setFilterByChange(e.target.value)}
                className="bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Changes</option>
                <option value="improved">Improved Only</option>
                <option value="worsened">Worsened Only</option>
                <option value="no_change">No Change Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 5. Comparison Table ── */}
        {loading || comparing ? (
          <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400">Calculating historical parameter trends...</p>
          </div>
        ) : selectedReportDocs.length < 2 ? (
          <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Select at least 2 reports to compare</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Historical comparison computes numerical trends across matching test parameters over time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Select Reports
            </button>
          </div>
        ) : filteredParameters.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">No matching parameters found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or active filter tab.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/70 border border-white/[0.07] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Test Name</th>
                    {tableDateHeaders.map((hdr, i) => (
                      <th key={i} className="py-3 px-4 text-center">
                        {hdr}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center">Change</th>
                    <th className="py-3 px-4 text-center">Trend</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredParameters.map((param, pIdx) => {
                    const iconConfig = getTestIcon(param.test_name);
                    const IconComponent = iconConfig.icon;

                    const isUp = param.absolute_change > 0.001;
                    const isDown = param.absolute_change < -0.001;
                    const isZero = !isUp && !isDown;

                    const seriesValues = param.values_series || [
                      { value: param.previous_value },
                      { value: param.current_value },
                    ];

                    const statusPillBg =
                      param.trend === 'Decreasing'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : param.trend === 'Increasing'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700';

                    return (
                      <tr
                        key={pIdx}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* Test Name & Icon */}
                        <td className="py-3.5 px-4 font-medium text-white flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconConfig.color}`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {param.test_name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {param.unit || 'units'}
                            </div>
                          </div>
                        </td>

                        {/* Date values */}
                        {seriesValues.map((sItem, sIdx) => (
                          <td
                            key={sIdx}
                            className="py-3.5 px-4 text-center font-mono font-medium text-slate-200"
                          >
                            {typeof sItem.value === 'number' ? sItem.value : sItem}
                          </td>
                        ))}

                        {/* If 2 reports were selected but table has 3 date headers */}
                        {seriesValues.length < tableDateHeaders.length && (
                          <td className="py-3.5 px-4 text-center text-slate-600 font-mono">—</td>
                        )}

                        {/* Change */}
                        <td className="py-3.5 px-4 text-center">
                          <div
                            className={`inline-flex flex-col items-center font-semibold font-mono ${
                              param.trend === 'Decreasing'
                                ? 'text-rose-400'
                                : param.trend === 'Increasing'
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            <span className="flex items-center space-x-0.5">
                              {isDown ? (
                                <TrendingDown className="w-3.5 h-3.5" />
                              ) : isUp ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                              <span>
                                {isUp ? '+' : ''}
                                {param.absolute_change}
                              </span>
                            </span>
                            <span className="text-[10px] opacity-80">
                              ({isUp ? '+' : ''}
                              {param.percentage_change}%)
                            </span>
                          </div>
                        </td>

                        {/* Trend Graphic */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center">
                            <Sparkline points={seriesValues} trend={param.trend} />
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${statusPillBg}`}
                          >
                            {param.trend || 'Stable'}
                          </span>
                        </td>

                        {/* Chevron */}
                        <td className="py-3.5 px-2 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Report Selector Modal (Modal to pick up to 3 reports) ── */}
      {selectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl bg-slate-900 border border-white/10 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Select Reports to Compare</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose 2 or 3 reports from your analyzed test history.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectorOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal List */}
            <div className="p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-white/[0.04]">
              {allReports.map((rep) => {
                const isSelected = selectedIds.includes(rep.id);
                return (
                  <div
                    key={rep.id}
                    onClick={() => toggleSelectReport(rep.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-500/10'
                        : 'bg-slate-950/40 border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <ReportThumbnail type={rep.document_type || 'CBC Report'} size="sm" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {rep.filename || 'Laboratory Report'}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                          <span>{formatShortDate(rep.report_date || rep.upload_date)}</span>
                          <span>•</span>
                          <span>{rep.parameters_count || 12} tests</span>
                        </div>
                      </div>
                    </div>

                    {/* Checkbox badge */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'border-white/20 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/[0.08] bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {selectedIds.length} of 3 reports selected
              </span>
              <button
                type="button"
                onClick={() => setSelectorOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Apply Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoricalComparisonPage;

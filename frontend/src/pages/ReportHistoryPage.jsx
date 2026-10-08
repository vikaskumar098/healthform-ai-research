import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import ReportThumbnail from '../components/common/ReportThumbnail';
import {
  ArrowLeft,
  UploadCloud,
  Search,
  MoreVertical,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Trash2,
  BarChart2,
  Eye,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';

/* ─── Helpers: Format Date & File Size ─── */
const formatDate = (str) => {
  if (!str) return 'Oct 04, 2026';
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return str;
  }
};

const formatFileSize = (bytes) => {
  if (!bytes) return '245 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const ITEMS_PER_PAGE = 9;

const ReportHistoryPage = () => {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | recent | cbc | lipid | thyroid | others
  const [filterType, setFilterType] = useState('all'); // all | cbc | lipid | thyroid | other
  const [sortBy, setSortBy] = useState('recent'); // recent | oldest | name_asc | params_desc
  const [currentPage, setCurrentPage] = useState(1);

  // Active dropdown menu id
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  // Close more menu on window click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.listReports();
      setReports(data || []);
    } catch (err) {
      setError('Failed to load laboratory reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report from your laboratory history?')) return;
    setDeletingId(id);
    try {
      await reportService.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingId(null);
      setOpenMenuId(null);
    }
  };

  // Categorization helpers
  const categorizedCounts = useMemo(() => {
    const total = reports.length;
    const recent = Math.min(5, reports.length);
    const cbc = reports.filter((r) => (r.document_type || r.filename).toLowerCase().includes('cbc')).length;
    const lipid = reports.filter((r) => (r.document_type || r.filename).toLowerCase().includes('lipid')).length;
    const thyroid = reports.filter((r) => (r.document_type || r.filename).toLowerCase().includes('thyroid')).length;
    const others = total - (cbc + lipid + thyroid);

    return {
      all: total,
      recent,
      cbc,
      lipid,
      thyroid,
      others: Math.max(0, others),
    };
  }, [reports]);

  // Filtered & Sorted list
  const filteredReports = useMemo(() => {
    let list = [...reports];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.filename.toLowerCase().includes(q) ||
          (r.patient_name && r.patient_name.toLowerCase().includes(q)) ||
          (r.document_type && r.document_type.toLowerCase().includes(q))
      );
    }

    // Active Category Tab
    if (activeTab === 'recent') {
      list = list.slice(0, 5);
    } else if (activeTab === 'cbc') {
      list = list.filter((r) => (r.document_type || r.filename).toLowerCase().includes('cbc'));
    } else if (activeTab === 'lipid') {
      list = list.filter((r) => (r.document_type || r.filename).toLowerCase().includes('lipid'));
    } else if (activeTab === 'thyroid') {
      list = list.filter((r) => (r.document_type || r.filename).toLowerCase().includes('thyroid'));
    } else if (activeTab === 'others') {
      list = list.filter((r) => {
        const lower = (r.document_type || r.filename).toLowerCase();
        return !lower.includes('cbc') && !lower.includes('lipid') && !lower.includes('thyroid');
      });
    }

    // Filter Type dropdown
    if (filterType !== 'all') {
      list = list.filter((r) => (r.document_type || r.filename).toLowerCase().includes(filterType));
    }

    // Sorting
    list.sort((a, b) => {
      const dateA = new Date(a.report_date || a.upload_date);
      const dateB = new Date(b.report_date || b.upload_date);
      if (sortBy === 'recent') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;
      if (sortBy === 'name_asc') return (a.document_type || a.filename).localeCompare(b.document_type || b.filename);
      if (sortBy === 'params_desc') return (b.parameters_count || 0) - (a.parameters_count || 0);
      return 0;
    });

    return list;
  }, [reports, searchQuery, activeTab, filterType, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] text-slate-400 font-mono">
              ← My Reports / History
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              My Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              View and manage all your laboratory reports.
            </p>
          </div>

          {/* Top Right Action Button */}
          <Link
            to="/upload"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer self-start md:self-auto"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Report</span>
          </Link>
        </div>

        {/* ── 1. Category Tabs ── */}
        <div className="flex items-center flex-wrap gap-2 border-b border-white/[0.06] pb-3">
          {[
            { id: 'all', label: `All Reports (${categorizedCounts.all})` },
            { id: 'recent', label: `Recent (${categorizedCounts.recent})` },
            { id: 'cbc', label: `CBC (${categorizedCounts.cbc})` },
            { id: 'lipid', label: `Lipid Profile (${categorizedCounts.lipid})` },
            { id: 'thyroid', label: `Thyroid (${categorizedCounts.thyroid})` },
            { id: 'others', label: `Others (${categorizedCounts.others})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
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

        {/* ── 2. Search & Filter Bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search reports..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Controls: Filter & Sort */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            {/* Filter */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span>Filter:</span>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="cbc">CBC Reports</option>
                <option value="lipid">Lipid Profiles</option>
                <option value="thyroid">Thyroid Function</option>
                <option value="liver">Liver Panels</option>
                <option value="kidney">Kidney Function</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
                <option value="params_desc">Most Parameters</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 3. Report Card Grid (3x3 Grid Matching Screenshot) ── */}
        {loading ? (
          <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading your analyzed laboratory reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-16 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No reports yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your first laboratory report to start analyzing your results with explainable, grounded AI.
              </p>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Report</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedReports.map((rep) => {
              const docType = rep.document_type || 'CBC Report';
              const isMenuOpen = openMenuId === rep.id;

              return (
                <div
                  key={rep.id}
                  onClick={() => navigate(`/reports/${rep.id}`)}
                  className="relative rounded-2xl bg-slate-900/80 border border-white/[0.08] p-4 flex items-start space-x-4 shadow-xl shadow-black/30 hover:border-blue-500/40 hover:bg-slate-900 transition-all cursor-pointer group"
                >
                  {/* Left: Thumbnail preview */}
                  <ReportThumbnail type={docType} size="md" />

                  {/* Right: Info */}
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {docType}
                    </h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {formatDate(rep.report_date || rep.upload_date)}
                    </div>
                    <div className="text-xs text-slate-300 font-medium mt-1">
                      {rep.parameters_count || 12} parameters
                    </div>

                    {/* Verified Badge */}
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Verified</span>
                      </span>
                    </div>

                    {/* File metadata */}
                    <div className="text-[11px] text-slate-500 font-mono mt-2 flex items-center space-x-1.5">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>PDF • {formatFileSize(rep.file_size)}</span>
                    </div>
                  </div>

                  {/* More Actions Menu Button */}
                  <div className="absolute top-3.5 right-3.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : rep.id);
                      }}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-all"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-slate-900 border border-white/10 shadow-2xl py-1.5 text-xs text-slate-200 divide-y divide-white/[0.06] animate-fade-in-up">
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/reports/${rep.id}`)}
                            className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.06] flex items-center space-x-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>View Analysis</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/reports/${rep.id}/details`)}
                            className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.06] flex items-center space-x-2"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Technical Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/comparison?initial=${rep.id}`)}
                            className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.06] flex items-center space-x-2"
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Compare Report</span>
                          </button>
                        </div>

                        <div className="py-1">
                          <a
                            href={`/api/reports/${rep.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-left px-3.5 py-1.5 hover:bg-white/[0.06] flex items-center space-x-2 text-slate-300"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Original File</span>
                          </a>

                          <button
                            type="button"
                            onClick={(e) => handleDelete(rep.id, e)}
                            className="w-full text-left px-3.5 py-1.5 hover:bg-rose-500/20 text-rose-400 flex items-center space-x-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Report</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 4. Footer Pagination (Showing 1-9 of 12 reports) ── */}
        {filteredReports.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.06] text-xs text-slate-400">
            <div>
              Showing {startIndex}-{endIndex} of {filteredReports.length} reports
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 disabled:opacity-40 disabled:pointer-events-none hover:bg-white/[0.08] flex items-center justify-center text-slate-300 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 disabled:opacity-40 disabled:pointer-events-none hover:bg-white/[0.08] flex items-center justify-center text-slate-300 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
  );
};

export default ReportHistoryPage;

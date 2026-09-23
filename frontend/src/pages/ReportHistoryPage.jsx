import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { 
  History, 
  Search, 
  Trash2, 
  ArrowRight, 
  FileText, 
  Calendar, 
  UploadCloud, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const ReportHistoryPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await reportService.listReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this report from history?")) return;
    setDeletingId(id);
    try {
      await reportService.deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      alert("Failed to delete report: " + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.patient_name && r.patient_name.toLowerCase().includes(term)) ||
      (r.filename && r.filename.toLowerCase().includes(term)) ||
      (r.report_date && r.report_date.includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Document Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Report Processing History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Archive of all ingested laboratory sessions with verified parameters and grounding metrics.
          </p>
        </div>

        <Link
          to="/upload"
          className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-brand-600 hover:bg-brand-500 text-white flex items-center space-x-2 shadow-lg shadow-brand-600/20 transition-all self-start md:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Report</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by patient name or filename..."
          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Date Collected</th>
                <th className="py-3 px-4">Original Filename</th>
                <th className="py-3 px-4 text-center">Parameters</th>
                <th className="py-3 px-4 text-center">Normal / Abnormal</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    Loading history...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No reports match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {r.patient_name || 'Anonymous Subject'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {r.report_date || r.upload_date}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                      {r.filename}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                      {r.parameters_count}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-emerald-400 font-semibold">{r.within_count}</span>
                      <span className="text-slate-600 px-1">/</span>
                      <span className="text-rose-400 font-semibold">{r.below_count + r.above_count}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/reports/${r.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-medium transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={(e) => handleDelete(r.id, e)}
                        disabled={deletingId === r.id}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ReportHistoryPage;

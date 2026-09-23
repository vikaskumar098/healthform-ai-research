import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { 
  FileText, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  UploadCloud, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  BarChart2, 
  TrendingUp,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const DashboardPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await reportService.listReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async (sampleId) => {
    setLoadingSample(sampleId);
    try {
      const newReport = await reportService.loadSampleReport(sampleId);
      window.location.href = `/reports/${newReport.id}`;
    } catch (err) {
      alert("Failed to load sample report: " + (err.response?.data?.detail || err.message));
      setLoadingSample(null);
    }
  };

  // Compute aggregated stats
  const totalReports = reports.length;
  const totalParams = reports.reduce((acc, r) => acc + (r.parameters_count || 0), 0);
  const totalWithin = reports.reduce((acc, r) => acc + (r.within_count || 0), 0);
  const totalBelow = reports.reduce((acc, r) => acc + (r.below_count || 0), 0);
  const totalAbove = reports.reduce((acc, r) => acc + (r.above_count || 0), 0);
  const totalOutside = totalBelow + totalAbove;

  // Pie chart data
  const pieData = [
    { name: 'Within Range', value: totalWithin || 1, color: '#10b981' },
    { name: 'Below Range', value: totalBelow || 0, color: '#3b82f6' },
    { name: 'Above Range', value: totalAbove || 0, color: '#f43f5e' },
  ];

  // Bar chart trend data from latest reports
  const trendData = reports.slice(0, 5).reverse().map((r, i) => ({
    name: r.report_date || `Report ${i + 1}`,
    within: r.within_count || 0,
    outside: (r.below_count || 0) + (r.above_count || 0),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Research & Clinical Pathology Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Laboratory Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multimodal document extraction, printed range priority, and real-time claim verification
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/upload"
            className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-brand-600 hover:bg-brand-500 text-white flex items-center space-x-2 shadow-lg shadow-brand-600/20 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Report</span>
          </Link>
          <Link
            to="/comparison"
            className="px-4 py-2.5 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-2 transition-colors"
          >
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span>Historical Comparison</span>
          </Link>
        </div>
      </div>

      {/* Instant 1-Click Synthetic Sample Quickloaders */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Quick Test Synthetic Benchmark Reports (Zero-Upload)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
            Demo Mode Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleLoadSample("1")}
            disabled={loadingSample !== null}
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-brand-500/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-brand-400">Sample 1: Routine CBC + CMP</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">PDF</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">12 Parameters • Low Hemoglobin • Elevated Glucose</p>
            <div className="text-[10px] text-brand-400 font-medium mt-2 flex items-center space-x-1">
              <span>{loadingSample === "1" ? "Processing..." : "Run Analysis"}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => handleLoadSample("2")}
            disabled={loadingSample !== null}
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-amber-400">Sample 2: Lipid & Hepatic Panel</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">PDF</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">9 Parameters • Elevated LDL Cholesterol • High ALT/AST</p>
            <div className="text-[10px] text-amber-400 font-medium mt-2 flex items-center space-x-1">
              <span>{loadingSample === "2" ? "Processing..." : "Run Analysis"}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => handleLoadSample("3")}
            disabled={loadingSample !== null}
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-emerald-400">Sample 3: Longitudinal Follow-up</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">PDF</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Patient A Follow-up • Delta: Hb +0.4 g/dL • Glucose -12 mg/dL</p>
            <div className="text-[10px] text-emerald-400 font-medium mt-2 flex items-center space-x-1">
              <span>{loadingSample === "3" ? "Processing..." : "Run Analysis"}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Reports</span>
            <FileText className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalReports}</p>
          <p className="text-[10px] text-slate-400 mt-1">Processed documents</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Parameters</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalParams}</p>
          <p className="text-[10px] text-slate-400 mt-1">Extracted & validated</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Within Range</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{totalWithin}</p>
          <p className="text-[10px] text-slate-400 mt-1">Matches reported limits</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Outside Range</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{totalOutside}</p>
          <p className="text-[10px] text-slate-400 mt-1">{totalBelow} below, {totalAbove} above</p>
        </div>

        <div className="col-span-2 lg:col-span-1 glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Latest Session</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-sm font-bold text-white truncate">
            {reports[0]?.patient_name || 'No reports yet'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {reports[0]?.report_date || 'Awaiting upload'}
          </p>
        </div>

      </div>

      {/* Visual Analytics & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Chart (2 columns) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Parameter Distribution Trend
              </h3>
              <p className="text-xs text-slate-400">Historical distribution of parameters within vs outside printed bounds</p>
            </div>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>

          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  />
                  <Bar dataKey="within" fill="#10b981" name="Within Reported Range" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outside" fill="#f43f5e" name="Outside Reported Range" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Load or upload reports to visualize distribution trends
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Donut Chart (1 column) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Range Status Ratio
            </h3>
            <p className="text-xs text-slate-400">Total analytical breakdown</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {totalParams > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No parameter data</div>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Within Range</span>
              </span>
              <span className="font-mono font-semibold">{totalWithin}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Below Range</span>
              </span>
              <span className="font-mono font-semibold">{totalBelow}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Above Range</span>
              </span>
              <span className="font-mono font-semibold">{totalAbove}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Reports Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Recent Laboratory Reports
            </h3>
            <p className="text-xs text-slate-400">Click any report to view structured parameters, RAG evidence, and claim audits</p>
          </div>
          <Link
            to="/history"
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1"
          >
            <span>View All History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3 px-4">Subject / Patient</th>
                <th className="py-3 px-4">Report Date</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4 text-center">Parameters</th>
                <th className="py-3 px-4 text-center">Status Breakdown</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No reports stored yet. Click one of the synthetic samples above or upload a document!
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {r.patient_name || 'Anonymous Subject'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {r.report_date || r.upload_date}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                      {r.filename}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                      {r.parameters_count}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1 text-[11px] font-mono">
                        <span className="text-emerald-400 font-semibold">{r.within_count} normal</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-rose-400 font-semibold">{r.below_count + r.above_count} outside</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/reports/${r.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-medium transition-colors"
                      >
                        <span>Open Analysis</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
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

export default DashboardPage;

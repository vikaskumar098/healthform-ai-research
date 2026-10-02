import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import {
  GitCompare,
  AlertCircle,
  Info,
  CheckSquare,
  Square,
  Loader2,
  UploadCloud,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const HistoricalComparisonPage = () => {
  const [searchParams] = useSearchParams();
  const initialReportId = searchParams.get('initial');

  const [reports, setReports] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const data = await reportService.listReports();
      setReports(data);

      if (initialReportId && data.some(r => r.id === initialReportId)) {
        const other = data.find(r => r.id !== initialReportId);
        if (other) {
          const ids = [initialReportId, other.id];
          setSelectedIds(ids);
          runComparison(ids);
        } else {
          setSelectedIds([initialReportId]);
        }
      } else if (data.length >= 2) {
        const ids = [data[0].id, data[1].id];
        setSelectedIds(ids);
        runComparison(ids);
      }
    } catch (_) {
      setError('Could not load your reports.');
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async (ids) => {
    if (ids.length < 2) { setComparisonResult(null); return; }
    setComparing(true); setError('');
    try {
      const res = await reportService.compareReports(ids);
      setComparisonResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Comparison failed. Please try again.');
    } finally { setComparing(false); }
  };

  const toggle = (id) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    setSelectedIds(newIds);
    if (newIds.length >= 2) runComparison(newIds);
    else setComparisonResult(null);
  };

  const parameters = comparisonResult?.parameters || [];
  const chartData = parameters.map((p) => ({
    name: p.test_name.length > 14 ? p.test_name.slice(0, 14) + '…' : p.test_name,
    fullName: p.test_name,
    Previous: p.previous_value,
    Current: p.current_value,
    unit: p.unit,
  }));

  /* ── delta indicator ── */
  const DeltaCell = ({ abs, pct }) => {
    if (abs === 0 || abs === null) {
      return <span className="text-slate-500 text-xs flex items-center space-x-1"><Minus className="w-3 h-3" /><span>No change</span></span>;
    }
    const up = abs > 0;
    return (
      <span className={`flex items-center space-x-1 text-xs font-semibold ${up ? 'text-blue-400' : 'text-purple-400'}`}>
        {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span>{up ? '+' : ''}{abs}</span>
        {pct !== null && pct !== undefined && (
          <span className="text-slate-500 font-normal">({up ? '+' : ''}{pct}%)</span>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center space-x-3">
          <GitCompare className="w-7 h-7 text-emerald-400" />
          <span>Compare Reports</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          See how your test results have changed between two reports
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-sm text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Report selection */}
      <div className="glass-card border border-white/[0.07] rounded-3xl p-6 space-y-4 animate-fade-in-up animate-fade-in-up-delay-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Select 2 Reports to Compare</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedIds.length < 2
                ? `Select ${2 - selectedIds.length} more report${2 - selectedIds.length !== 1 ? 's' : ''}`
                : '✅ Comparison ready'
              }
            </p>
          </div>
          {selectedIds.length >= 2 && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              Ready
            </span>
          )}
        </div>

        {reports.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-slate-400 text-sm">You need at least 2 reports to compare.</p>
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload a Report</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.map((r) => {
              const selected = selectedIds.includes(r.id);
              return (
                <div
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selected
                      ? 'bg-brand-950/40 border-brand-500/60 ring-1 ring-brand-500/30'
                      : 'bg-slate-900/60 border-white/[0.07] hover:border-white/[0.14] hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 mb-2">
                    {selected
                      ? <CheckSquare className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      : <Square className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    }
                    <p className="font-semibold text-white text-sm truncate">
                      {r.patient_name || 'Lab Report'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 ml-6.5">
                    {r.report_date || r.upload_date}
                    {r.parameters_count > 0 && ` · ${r.parameters_count} tests`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading comparison */}
      {comparing && (
        <div className="flex items-center justify-center py-10 space-x-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
          <span className="text-sm">Comparing reports…</span>
        </div>
      )}

      {/* Results */}
      {comparisonResult && !comparing && (
        <div className="space-y-6 animate-fade-in-up">

          {/* Observation */}
          {comparisonResult.neutral_observation && (
            <div className="flex items-start space-x-3 p-5 rounded-2xl bg-slate-900/60 border border-white/[0.07]">
              <Info className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white mb-1">Summary</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {comparisonResult.neutral_observation}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="glass-card border border-white/[0.07] rounded-3xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white">Value Comparison Chart</h2>
              <p className="text-xs text-slate-500">Grey = previous · Blue = current · Numbers show measured values</p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', fontSize: '12px' }}
                      formatter={(val, name, item) => [`${val} ${item.payload.unit}`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
                    <Bar dataKey="Previous" fill="#475569" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Current" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Delta table */}
          {parameters.length > 0 && (
            <div className="glass-card border border-white/[0.07] rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.06]">
                <h2 className="text-base font-bold text-white">
                  Detailed Changes ({parameters.length} matching tests)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Changes shown as numbers only — not labeled as "better" or "worse"
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-950/60 text-xs text-slate-400 font-medium border-b border-white/[0.06]">
                      <th className="text-left py-3 px-4">Test</th>
                      <th className="text-center py-3 px-4">Previous</th>
                      <th className="text-center py-3 px-4">Current</th>
                      <th className="text-left py-3 px-4">Unit</th>
                      <th className="text-left py-3 px-4">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {parameters.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">{p.test_name}</td>
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono">{p.previous_value}</td>
                        <td className="py-3.5 px-4 text-center text-white font-mono font-bold">{p.current_value}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">{p.unit}</td>
                        <td className="py-3.5 px-4">
                          <DeltaCell abs={p.absolute_change} pct={p.percentage_change} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/[0.05] text-xs text-slate-500">
            <strong className="text-slate-400">Note:</strong> Changes are shown as numbers only. HealthForm AI does not label these changes as "improvements" or "worsenings" — only your doctor can interpret what these changes mean for your health.
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalComparisonPage;

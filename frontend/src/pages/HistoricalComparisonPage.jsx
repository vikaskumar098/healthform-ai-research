import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { 
  GitCompare, 
  TrendingUp, 
  Calendar, 
  CheckSquare, 
  Square, 
  Layers, 
  AlertCircle,
  Info,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
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

  useEffect(() => {
    loadReportsList();
  }, []);

  const loadReportsList = async () => {
    try {
      const data = await reportService.listReports();
      setReports(data);

      if (initialReportId && data.some(r => r.id === initialReportId)) {
        // If there's an initial report and another report exists, pre-select both
        const otherReport = data.find(r => r.id !== initialReportId);
        if (otherReport) {
          const ids = [initialReportId, otherReport.id];
          setSelectedIds(ids);
          executeComparison(ids);
        } else {
          setSelectedIds([initialReportId]);
        }
      } else if (data.length >= 2) {
        // Automatically preselect first two reports for instant demonstration!
        const ids = [data[0].id, data[1].id];
        setSelectedIds(ids);
        executeComparison(ids);
      }
    } catch (err) {
      setError("Failed to load reports for comparison.");
    } finally {
      setLoading(false);
    }
  };

  const executeComparison = async (ids) => {
    if (ids.length < 2) {
      setComparisonResult(null);
      return;
    }
    setComparing(true);
    setError('');
    try {
      const res = await reportService.compareReports(ids);
      setComparisonResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || "Historical comparison failed.");
    } finally {
      setComparing(false);
    }
  };

  const toggleSelectReport = (id) => {
    let newIds = [];
    if (selectedIds.includes(id)) {
      newIds = selectedIds.filter(x => x !== id);
    } else {
      newIds = [...selectedIds, id];
    }
    setSelectedIds(newIds);
    if (newIds.length >= 2) {
      executeComparison(newIds);
    } else {
      setComparisonResult(null);
    }
  };

  const parameters = comparisonResult?.parameters || [];

  // Chart data formatting
  const chartData = parameters.map((p) => ({
    name: p.test_name.length > 15 ? p.test_name.substring(0, 15) + '...' : p.test_name,
    fullName: p.test_name,
    previous: p.previous_value,
    current: p.current_value,
    unit: p.unit,
    delta: p.absolute_change,
    pct: p.percentage_change
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <GitCompare className="w-4 h-4" />
            <span>Longitudinal Laboratory Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Historical Report Comparison
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compute chronological numerical deltas across two or more laboratory tests without clinical outcome bias.
          </p>
        </div>

        {/* Safety Badge */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 max-w-sm">
          <strong>Neutral Presentation Rule:</strong> HealthForm AI does not label numerical changes as "improvement" or "deterioration".
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Report Selection Grid */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Select Reports to Compare (Minimum 2)
            </h3>
            <p className="text-xs text-slate-400">Selected: {selectedIds.length} report(s)</p>
          </div>
          {selectedIds.length >= 2 && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-800/50">
              Ready for Comparison
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r) => {
            const isSelected = selectedIds.includes(r.id);
            return (
              <div
                key={r.id}
                onClick={() => toggleSelectReport(r.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-brand-950/40 border-brand-500/60 ring-1 ring-brand-500/40 shadow-lg shadow-brand-500/10' 
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                    <span className="text-xs font-bold text-white truncate max-w-[170px]">
                      {r.patient_name || 'Subject'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {r.parameters_count} params
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{r.report_date || r.upload_date}</span>
                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]">{r.filename}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Results */}
      {comparing && (
        <div className="py-12 text-center text-xs text-slate-400 font-mono">
          Calculating longitudinal parameter deltas...
        </div>
      )}

      {comparisonResult && !comparing && (
        <div className="space-y-6">
          
          {/* Neutral Observation Card */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-start space-x-3 text-xs">
            <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                Longitudinal Audit Observation:
              </h4>
              <p className="text-slate-400 mt-1 leading-relaxed">
                {comparisonResult.neutral_observation}
              </p>
            </div>
          </div>

          {/* Recharts Comparison Chart */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Numerical Parameter Trajectory
                </h3>
                <p className="text-xs text-slate-400">Side-by-side comparison of measured values across timestamps</p>
              </div>
              <BarChart3 className="w-5 h-5 text-brand-400" />
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-25} textAnchor="end" />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    formatter={(val, name, item) => [`${val} ${item.payload.unit}`, name === 'previous' ? 'Previous Session' : 'Current Session']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="previous" name="Previous Session" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" name="Current Session" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Numerical Delta Table */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Matching Parameter Deltas ({parameters.length} Tests)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-3 px-4">Test Name</th>
                    <th className="py-3 px-4 text-center">Previous Value</th>
                    <th className="py-3 px-4 text-center">Current Value</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-center">Absolute Delta (Δ)</th>
                    <th className="py-3 px-4 text-center">Percentage Delta (Δ%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {parameters.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No matching laboratory parameters found across the selected reports.
                      </td>
                    </tr>
                  ) : (
                    parameters.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors font-mono">
                        <td className="py-3.5 px-4 font-sans font-semibold text-white">
                          {p.test_name}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                          {p.previous_value}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-100 font-bold">
                          {p.current_value}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {p.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                          {p.absolute_change > 0 ? `+${p.absolute_change}` : p.absolute_change}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            p.percentage_change > 0 
                              ? 'bg-blue-950/50 text-blue-300 border border-blue-800/50' 
                              : p.percentage_change < 0
                              ? 'bg-purple-950/50 text-purple-300 border border-purple-800/50'
                              : 'text-slate-400'
                          }`}>
                            {p.percentage_change > 0 ? `+${p.percentage_change}%` : `${p.percentage_change}%`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default HistoricalComparisonPage;

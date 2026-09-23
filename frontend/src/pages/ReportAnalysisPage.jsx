import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import StatusBadge from '../components/common/StatusBadge';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import ParameterDetailModal from '../components/reports/ParameterDetailModal';
import ClaimVerificationMatrix from '../components/reports/ClaimVerificationMatrix';
import { 
  FileText, 
  Activity, 
  CheckCircle2, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  HelpCircle, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  GitCompare, 
  RefreshCw, 
  AlertCircle, 
  Search, 
  Filter, 
  Info, 
  ExternalLink,
  BookOpen,
  Eye
} from 'lucide-react';

const ReportAnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('parameters'); // 'parameters' | 'explanation' | 'verification' | 'raw'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedParam, setSelectedParam] = useState(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [id]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReport(id);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      const updated = await reportService.reanalyzeReport(id);
      setReport(updated);
    } catch (err) {
      alert("Re-analysis failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading report parameters and audit records...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 glass-card rounded-2xl border border-rose-800/60 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Report Not Found</h2>
        <p className="text-xs text-slate-400">{error || "Could not retrieve report data."}</p>
        <Link to="/dashboard" className="inline-block px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const parameters = report.parameters || [];
  const analysis = report.analysis || {};
  const claims = analysis.claims || [];
  const evidenceList = analysis.evidence || [];

  // Filter parameters
  const filteredParams = parameters.filter((p) => {
    const matchesSearch = p.test_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && p.status === statusFilter;
  });

  // Summary counts
  const totalCount = parameters.length;
  const withinCount = parameters.filter(p => p.status === 'within_reported_range').length;
  const belowCount = parameters.filter(p => p.status === 'below_reported_range').length;
  const aboveCount = parameters.filter(p => p.status === 'above_reported_range').length;
  const unknownCount = parameters.filter(p => p.status === 'unknown').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner: Patient Metadata */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-mono font-semibold">
                LAB REPORT AUDIT
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: {report.id.substring(0, 8)}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              {report.patient_name || 'Anonymous Subject'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Specimen Collected: <strong className="text-slate-200">{report.report_date || report.upload_date}</strong> • File: <span className="font-mono text-slate-300">{report.filename}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${isReanalyzing ? 'animate-spin' : ''}`} />
              <span>{isReanalyzing ? 'Re-analyzing...' : 'Re-run Analysis'}</span>
            </button>

            <Link
              to={`/comparison?initial=${report.id}`}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare with History</span>
            </Link>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
              <span>Parameters Detected</span>
              <Layers className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white">{totalCount}</p>
            <p className="text-[10px] text-slate-400">Validated analytical tests</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
            <div className="flex items-center justify-between text-emerald-400 text-xs mb-1 font-medium">
              <span>Within Reported Range</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{withinCount}</p>
            <p className="text-[10px] text-slate-400">Normal interval adherence</p>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40">
            <div className="flex items-center justify-between text-blue-400 text-xs mb-1 font-medium">
              <span>Below Reported Range</span>
              <ArrowDownCircle className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{belowCount}</p>
            <p className="text-[10px] text-slate-400">Below printed threshold</p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40">
            <div className="flex items-center justify-between text-rose-400 text-xs mb-1 font-medium">
              <span>Above Reported Range</span>
              <ArrowUpCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-400">{aboveCount}</p>
            <p className="text-[10px] text-slate-400">Above printed threshold</p>
          </div>

        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-2 text-xs font-semibold">
        {[
          { key: 'parameters', label: 'Structured Parameters', count: totalCount, icon: Layers },
          { key: 'explanation', label: 'AI Explanation & RAG Citations', icon: Sparkles },
          { key: 'verification', label: 'Claim Verification Matrix', count: claims.length, icon: ShieldCheck },
          { key: 'raw', label: 'Raw Extracted Document', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all ${
                isActive 
                  ? 'border-brand-500 text-brand-400 bg-slate-900/40' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                  isActive ? 'bg-brand-500/20 text-brand-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Structured Parameter Table */}
      {activeTab === 'parameters' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search parameter (e.g., Hemoglobin)..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1" /> Filter:
              </span>
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Below Range', value: 'below_reported_range' },
                { label: 'Above Range', value: 'above_reported_range' },
                { label: 'Within Range', value: 'within_reported_range' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === f.value
                      ? 'bg-brand-600 text-white font-medium'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-3 px-4">Test Name</th>
                    <th className="py-3 px-4 text-center">Result</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Reported Reference Range</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Confidence</th>
                    <th className="py-3 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredParams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No parameters match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredParams.map((p, idx) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                          p.status === 'below_reported_range' 
                            ? 'bg-blue-950/10' 
                            : p.status === 'above_reported_range'
                            ? 'bg-rose-950/10'
                            : ''
                        }`}
                        onClick={() => setSelectedParam(p)}
                      >
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {p.test_name}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-100 text-sm">
                          {p.value}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {p.unit}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-300">
                          {p.reference_range?.raw || 'Not Stated'}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={p.status} flag={p.flag} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <ConfidenceBadge 
                            confidence={p.confidence} 
                            validationStatus={p.validation_status}
                            errors={p.validation_errors}
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedParam(p); }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-600/30 text-slate-300 hover:text-brand-300 transition-colors"
                            title="Inspect Parameter Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
      )}

      {/* TAB 2: AI Grounded Explanation & RAG */}
      {activeTab === 'explanation' && (
        <div className="space-y-6">
          
          {/* Executive Summary Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-brand-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Grounded Clinical Synthesis
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              {analysis.summary}
            </p>
          </div>

          {/* Main Structured Findings Section */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Detailed Findings in Relation to Reported Intervals
            </h4>
            
            <div className="prose prose-invert prose-xs max-w-none text-slate-300 space-y-2 whitespace-pre-line leading-relaxed font-sans">
              {analysis.explanation}
            </div>

            {/* Uncertainty Statement */}
            <div className="pt-4 border-t border-slate-800/80 bg-slate-950/40 p-4 rounded-xl text-xs text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-400 font-semibold uppercase tracking-wider text-[11px]">
                <Info className="w-3.5 h-3.5" />
                <span>Assay Uncertainty & Limitations:</span>
              </div>
              <p>{analysis.uncertainty}</p>
            </div>
          </div>

          {/* RAG Context & Evidence Cards */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Curated Reference Evidence (RAG Corpus)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Isolated Knowledge Base</span>
            </div>

            {evidenceList.length === 0 ? (
              <p className="text-xs text-slate-500">Relevant reference information was not found in the local knowledge base.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evidenceList.map((ev, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-brand-300">{ev.title}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Score: {ev.score ? (ev.score * 100).toFixed(1) + '%' : 'Verified'}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400">Section: {ev.section}</p>
                    <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-4">
                      "{ev.content}"
                    </p>
                    <p className="text-[10px] text-slate-400 pt-1 font-mono">
                      Source: {ev.source}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: Claim Verification Matrix */}
      {activeTab === 'verification' && (
        <ClaimVerificationMatrix claims={claims} />
      )}

      {/* TAB 4: Raw Extracted Document */}
      {activeTab === 'raw' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Raw Extracted Document Stream (OCR Output)
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              {report.raw_text ? `${report.raw_text.split('\n').length} lines` : '0 lines'}
            </span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[600px] leading-relaxed">
            {report.raw_text || "No raw text recorded."}
          </pre>
        </div>
      )}

      {/* Parameter Detail Modal */}
      {selectedParam && (
        <ParameterDetailModal 
          parameter={selectedParam} 
          onClose={() => setSelectedParam(null)} 
        />
      )}

    </div>
  );
};

export default ReportAnalysisPage;

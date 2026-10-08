import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import ParticleCanvas from '../components/common/ParticleCanvas';
import WaveformSVG from '../components/common/WaveformSVG';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  Trash2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  FileCheck,
  Sliders,
  Sparkles,
  Brain,
  MessageSquare,
  Activity,
  Heart,
  Droplets,
  Layers,
  Thermometer,
  Microscope,
  Info,
  Check,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Shield,
  Lightbulb,
} from 'lucide-react';

/* ─── Supported Report Types ─── */
const SUPPORTED_REPORTS = [
  { name: 'Complete Blood Count (CBC)', icon: Droplets, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { name: 'Liver Function Test (LFT)', icon: Activity, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { name: 'Kidney Function Test (KFT)', icon: ShieldCheck, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { name: 'Lipid Profile', icon: Heart, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { name: 'Thyroid Function Test (TFT)', icon: Thermometer, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { name: 'Blood Sugar (Glucose, HbA1c)', icon: Layers, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { name: 'Urine Routine & Microscopy', icon: Microscope, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
];

/* ─── Live Extraction Demonstration Fallback Parameters ─── */
const DEMO_EXTRACTED_PARAMETERS = [
  {
    name: 'Hemoglobin (Hb)',
    value: '11.2',
    unit: 'g/dL',
    range: '13.0 – 17.0 g/dL',
    status: 'low',
    iconColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    minStage: 2,
  },
  {
    name: 'Total WBC Count',
    value: '7.4',
    unit: '×10³/µL',
    range: '4.0 – 11.0 ×10³/µL',
    status: 'normal',
    iconColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    minStage: 2,
  },
  {
    name: 'Platelet Count',
    value: '245',
    unit: '×10³/µL',
    range: '150 – 450 ×10³/µL',
    status: 'normal',
    iconColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    minStage: 3,
  },
  {
    name: 'RBC Count',
    value: '4.1',
    unit: '×10⁶/µL',
    range: '4.5 – 5.5 ×10⁶/µL',
    status: 'low',
    iconColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    minStage: 3,
  },
  {
    name: 'Hematocrit (HCT)',
    value: '36.0',
    unit: '%',
    range: '40 – 50 %',
    status: 'low',
    iconColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    minStage: 4,
  },
  {
    name: 'MCV',
    value: '87.2',
    unit: 'fL',
    range: '80 – 100 fL',
    status: 'normal',
    iconColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    minStage: 4,
  },
];

/* ─── AI PROCESSING SCREEN COMPONENT ────────────────────────────── */
const AIProcessingScreen = ({ 
  file, 
  stageIndex, 
  liveParameters, 
  onRetry, 
  onBackToUpload,
  errorInfo,
  isComplete 
}) => {
  const stepsCount = 5;
  const currentStep = errorInfo ? stageIndex + 1 : Math.min(5, Math.max(1, stageIndex + 1));
  const progressPercent = errorInfo 
    ? Math.min(100, Math.max(20, (stageIndex + 1) * 20)) 
    : Math.min(100, Math.max(20, currentStep * 20));

  const filename = file?.name || 'lab_report_sample.pdf';
  const filesize = file?.size ? `${(file.size / 1024).toFixed(0)} KB` : '245 KB';
  const fileExt = file?.name 
    ? file.name.slice(file.name.lastIndexOf('.')).toUpperCase().replace('.', '') 
    : 'PDF';

  const stages = [
    {
      title: 'Upload Complete',
      desc: `${filename} • ${filesize} • ${fileExt}`,
      icon: UploadCloud,
    },
    {
      title: 'Document Validated',
      desc: 'Confirmed as laboratory report',
      icon: FileCheck,
    },
    {
      title: 'Extracting Results',
      desc: 'Reading and extracting test parameters...',
      icon: FileText,
    },
    {
      title: 'Checking Reference Ranges',
      desc: 'Comparing with laboratory reference ranges...',
      icon: Sliders,
    },
    {
      title: 'Preparing Insights',
      desc: 'Generating easy-to-understand explanations...',
      icon: Brain,
    },
  ];

  return (
    <div className="w-full min-h-full bg-[#030816] text-slate-100 selection:bg-cyan-500 selection:text-white pb-20 relative overflow-x-hidden font-sans">
      
      {/* Background Ambient Glows & Grid */}
      <div className="absolute inset-0 bg-grid opacity-25 pointer-events-none" />
      <div className="absolute inset-0 z-0 opacity-60">
        <ParticleCanvas count={30} speed={0.15} maxRadius={1.8} color1="34,211,238" color2="99,102,241" color3="16,185,129" />
      </div>
      <div className="absolute top-10 left-1/4 w-[650px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[450px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-7 relative z-10">

        {/* ── TOP HEADER ── */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          
          {/* Animated AI Status Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-cyan-950/80 border border-cyan-500/40 text-xs font-semibold text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)] animate-pulse-slow">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Analysis in Progress</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Analyzing Your{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300 bg-clip-text text-transparent drop-shadow-sm">
              Laboratory Report
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-normal leading-relaxed">
            Our AI is reading your report, extracting key parameters, and generating clear insights.
          </p>
        </div>

        {/* ── SUCCESS BANNER (WHEN PROCESSING REACHES 100%) ── */}
        {isComplete && (
          <div className="max-w-4xl mx-auto rounded-2xl bg-emerald-950/60 border border-emerald-500/50 p-4 shadow-[0_0_30px_rgba(16,185,129,0.25)] flex items-center justify-between animate-fade-in-up">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Analysis Complete</h3>
                <p className="text-xs text-emerald-200">✓ Report analyzed successfully. Redirecting to insights...</p>
              </div>
            </div>
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin flex-shrink-0" />
          </div>
        )}

        {/* ── ERROR DISPLAY (IF PIPELINE FAILS OR DOCUMENT IS INVALID) ── */}
        {errorInfo && (
          <div className="max-w-4xl mx-auto rounded-3xl bg-rose-950/60 border border-rose-500/70 p-6 space-y-4 shadow-[0_0_35px_rgba(244,63,94,0.3)] animate-fade-in-up">
            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-rose-500/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-bold text-white">
                  {errorInfo.title || (errorInfo.isInvalidDocument ? 'Document Not Recognized' : "Analysis couldn't be completed")}
                </h3>
                <p className="text-xs sm:text-sm text-rose-200 leading-relaxed">
                  {errorInfo.message || (errorInfo.isInvalidDocument 
                    ? 'This file does not appear to be a valid laboratory report. Please upload a clear laboratory document.' 
                    : "We couldn't process this report right now. Please try again.")}
                </p>
                {errorInfo.document_type && (
                  <div className="pt-2 flex items-center space-x-2 text-xs">
                    <span className="text-slate-400">Detected format:</span>
                    <span className="font-semibold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase font-mono">
                      {errorInfo.document_type.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-end gap-3">
              {errorInfo.isInvalidDocument ? (
                <>
                  <button
                    type="button"
                    onClick={onBackToUpload}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-white/10 cursor-pointer"
                  >
                    Choose Another File
                  </button>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onBackToUpload}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-white/10 cursor-pointer"
                  >
                    Back to Upload
                  </button>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────
            MAIN 3-COLUMN WORKSPACE:
            LEFT: Vertical Timeline (5 Stages with vertical connecting line)
            CENTER: Laboratory Report with Active Scanning Beam & Bracket Corners
            RIGHT: Extracted Parameters Panel
            ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* ── LEFT: PROCESSING TIMELINE (4 cols) ── */}
          <div className="lg:col-span-4 flex flex-col justify-between relative">
            
            {/* Continuous Vertical Connecting Line */}
            <div className="absolute left-[31px] top-6 bottom-6 w-[2px] bg-slate-800 z-0 pointer-events-none">
              <div 
                className="w-full bg-gradient-to-b from-emerald-500 via-cyan-400 to-transparent transition-all duration-700"
                style={{ 
                  height: `${Math.min(100, Math.max(0, (stageIndex) * 25))}%` 
                }}
              />
            </div>

            <div className="space-y-3.5 relative z-10">
              {stages.map((st, idx) => {
                const isCompleted = stageIndex > idx || (stageIndex === 4 && idx === 4 && isComplete);
                const isActive = stageIndex === idx && !errorInfo;
                const isFailed = errorInfo && stageIndex === idx;
                const isPending = stageIndex < idx && !errorInfo;

                let cardStyle = 'bg-slate-950/50 border-white/[0.06] opacity-40';
                let iconWrapperStyle = 'bg-slate-800 text-slate-500 border-white/10';
                let nodeStyle = 'border-slate-700 bg-slate-900 text-slate-500';

                if (isCompleted) {
                  cardStyle = 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/30';
                  iconWrapperStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
                  nodeStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
                } else if (isActive) {
                  cardStyle = 'bg-gradient-to-br from-blue-950/70 via-slate-900/90 to-cyan-950/60 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/50 scale-[1.01]';
                  iconWrapperStyle = 'bg-cyan-500/25 text-cyan-200 border-cyan-300/50';
                  nodeStyle = 'border-cyan-400 bg-cyan-500/30 text-cyan-300 animate-pulse shadow-[0_0_14px_rgba(34,211,238,0.8)]';
                } else if (isFailed) {
                  cardStyle = 'bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/50';
                  iconWrapperStyle = 'bg-rose-500/20 text-rose-300 border-rose-400/40';
                  nodeStyle = 'border-rose-500 bg-rose-500/20 text-rose-400';
                }

                const StageIcon = st.icon;

                return (
                  <div 
                    key={st.title} 
                    className={`relative p-3.5 rounded-2xl border transition-all duration-300 ${cardStyle}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        
                        {/* Circular Node Icon */}
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${iconWrapperStyle}`}>
                          <StageIcon className="w-4 h-4" />
                        </div>

                        {/* Title & Description */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{st.title}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[170px] sm:max-w-[210px] font-mono">
                            {st.desc}
                          </p>
                        </div>
                      </div>

                      {/* Right Status Indicator */}
                      <div className="flex-shrink-0 ml-2">
                        {isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            ✓
                          </div>
                        ) : isActive ? (
                          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                        ) : isFailed ? (
                          <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center text-xs font-bold">
                            ✕
                          </div>
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700 block" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>


          {/* ── CENTER: REPORT VISUALIZATION WITH SCANNING BEAM (4 cols) ── */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 rounded-3xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-xl relative overflow-hidden group shadow-2xl shadow-cyan-950/40">
            
            {/* Glowing Corner Accents (Futuristic Scanning Frame) */}
            <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg pointer-events-none shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg pointer-events-none shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg pointer-events-none shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-cyan-400 rounded-br-lg pointer-events-none shadow-[0_0_10px_rgba(34,211,238,0.5)]" />

            {/* Glowing Pedestal Base under the document */}
            <div className="absolute bottom-12 inset-x-8 h-12 bg-gradient-to-t from-cyan-500/20 via-blue-500/10 to-transparent blur-md rounded-full pointer-events-none" />

            {/* 3D Perspective Floating Document Preview */}
            <div className="relative w-full max-w-[315px] rounded-2xl bg-white text-slate-900 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(56,189,248,0.25)] border border-slate-200 overflow-hidden transform perspective-1000 rotate-x-2 transition-transform duration-500 hover:rotate-x-0">
              
              {/* Animated Laser Scanning Beam */}
              <div className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(56,189,248,1),0_0_35px_rgba(34,211,238,0.8)] animate-scan-beam pointer-events-none z-30" />

              {/* Document Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-1.5">
                  <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    +
                  </div>
                  <span className="font-bold text-xs text-slate-900 tracking-tight">
                    CityCare Diagnostics
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span className="text-[8px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    CBC Panel
                  </span>
                </div>
              </div>

              {/* Patient Details */}
              <div className="py-2 grid grid-cols-2 gap-y-0.5 text-[8px] font-mono text-slate-500 border-b border-slate-100 leading-tight">
                <div>Patient Name : <span className="font-semibold text-slate-800">Rahul Sharma</span></div>
                <div>Age / Gender : <span className="font-semibold text-slate-800">26 Years / Male</span></div>
                <div>Patient ID : <span className="font-semibold text-slate-800">CCD226091701</span></div>
                <div>Sample Type : <span className="font-semibold text-slate-800">Whole Blood</span></div>
                <div>Collection Date : <span className="font-semibold text-slate-800">17-Sep-2026</span></div>
                <div>Report Date : <span className="font-semibold text-slate-800">18-Sep-2026</span></div>
              </div>

              {/* Synthetic Tests Table */}
              <div className="pt-1.5 text-[9px] font-mono">
                <div className="grid grid-cols-4 py-1 text-[7px] text-slate-400 font-sans uppercase font-bold border-b border-slate-100">
                  <span className="col-span-1">Test Name</span>
                  <span className="text-center">Result</span>
                  <span className="text-center">Reference Range</span>
                  <span className="text-right">Status</span>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-rose-600 truncate">Hemoglobin (Hb)</span>
                    <span className="text-center font-bold text-rose-600">11.2</span>
                    <span className="text-center text-slate-400 text-[8px]">13.0 – 17.0</span>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[7.5px] font-bold bg-rose-50 text-rose-600">Low</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-slate-800 truncate">Total WBC Count</span>
                    <span className="text-center font-bold text-emerald-600">7.4</span>
                    <span className="text-center text-slate-400 text-[8px]">4.0 – 11.0</span>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[7.5px] font-bold bg-emerald-50 text-emerald-600">Normal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-slate-800 truncate">Platelet Count</span>
                    <span className="text-center font-bold text-emerald-600">245</span>
                    <span className="text-center text-slate-400 text-[8px]">150 – 450</span>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[7.5px] font-bold bg-emerald-50 text-emerald-600">Normal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-rose-600 truncate">RBC Count</span>
                    <span className="text-center font-bold text-rose-600">4.1</span>
                    <span className="text-center text-slate-400 text-[8px]">4.5 – 5.5</span>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[7.5px] font-bold bg-rose-50 text-rose-600">Low</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-rose-600 truncate">Hematocrit (HCT)</span>
                    <span className="text-center font-bold text-rose-600">36.0</span>
                    <span className="text-center text-slate-400 text-[8px]">40 – 50</span>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[7.5px] font-bold bg-rose-50 text-rose-600">Low</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-slate-800 truncate">MCV</span>
                    <span className="text-center font-bold text-emerald-600">87.2</span>
                    <span className="text-center text-slate-400 text-[8px]">80 – 100</span>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[7.5px] font-bold bg-emerald-50 text-emerald-600">Normal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[7.5px] text-slate-400">
                <span className="italic font-serif">Verified Pathology Record</span>
                <span className="font-serif italic font-bold text-slate-700">Dr. A. Mehta, MD (Pathology)</span>
              </div>
            </div>

            {/* Scanning Status Pill Badge */}
            <div className="mt-4 inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-950/90 border border-cyan-500/40 text-[11px] text-cyan-300 font-mono shadow-lg shadow-cyan-950/60 z-10">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Scanning document...</span>
            </div>

          </div>


          {/* ── RIGHT: EXTRACTED PARAMETERS PANEL (4 cols) ── */}
          <div className="lg:col-span-4 rounded-3xl bg-slate-900/80 border border-white/[0.08] p-5 flex flex-col justify-between backdrop-blur-xl shadow-xl shadow-slate-950/60">
            
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h2 className="font-bold text-sm text-white tracking-tight">
                    Extracted Parameters
                  </h2>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 shadow-sm shadow-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Extraction</span>
                </div>
              </div>

              {/* List of Extracted Biomarkers */}
              <div className="space-y-2">
                {(liveParameters && liveParameters.length > 0 ? liveParameters : DEMO_EXTRACTED_PARAMETERS).map((param) => {
                  const isVisible = stageIndex >= param.minStage;
                  return (
                    <div 
                      key={param.name}
                      className={`p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between transition-all duration-500 ${
                        isVisible 
                          ? 'opacity-100 translate-y-0 scale-100' 
                          : 'opacity-20 translate-y-1 scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold border flex-shrink-0 ${param.iconColor}`}>
                          {param.status === 'low' ? (
                            <Droplets className="w-3.5 h-3.5" />
                          ) : param.status === 'high' ? (
                            <Activity className="w-3.5 h-3.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{param.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">Reference: {param.range}</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs font-bold text-white font-mono">
                          {param.value} <span className="text-[10px] text-slate-400 font-normal">{param.unit}</span>
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase mt-0.5 ${
                          param.status === 'low'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : param.status === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {param.status === 'low' ? 'Below Range' : param.status === 'high' ? 'Above Range' : 'Normal'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Bottom Status Tip */}
            <div className="pt-3 mt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span>Deterministic Range Engine</span>
              <span className="text-cyan-400 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Active</span>
              </span>
            </div>

          </div>

        </div>


        {/* ── PROGRESS BAR SECTION ── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-white flex items-center space-x-2">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : errorInfo ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              )}
              <span>
                {isComplete 
                  ? 'Analysis Complete' 
                  : errorInfo 
                  ? 'Processing Halted' 
                  : 'Processing your report...'}
              </span>
            </span>
            <span className="text-cyan-300 font-mono font-semibold">
              {currentStep} of {stepsCount} steps • {progressPercent}%
            </span>
          </div>
          
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/[0.08] relative">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                errorInfo 
                  ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]' 
                  : 'bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 shadow-[0_0_16px_rgba(34,211,238,0.7)]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>


        {/* ── 4 COMPACT SECURITY & ASSURANCE CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-start space-x-3 hover:border-blue-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Secure Processing</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Your data is encrypted and processed securely.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-start space-x-3 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">AI-Powered Extraction</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">We extract key laboratory parameters using advanced AI.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-start space-x-3 hover:border-indigo-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Reference Range Validation</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">We compare results with laboratory reference ranges.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-start space-x-3 hover:border-purple-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Clear Insights</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">You&apos;ll receive easy-to-understand explanations next.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};


/* ─── MAIN UPLOAD PAGE COMPONENT ───────────────────────────────── */
const UploadPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [errorInfo, setErrorInfo] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  /* ── Drag & drop handlers ── */
  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) selectFile(e.dataTransfer.files[0]);
  };

  const onChange = (e) => {
    if (e.target.files?.[0]) selectFile(e.target.files[0]);
  };

  const selectFile = (f) => {
    setErrorInfo(null);
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      setErrorInfo({
        title: 'Unsupported file format',
        message: 'Please upload a PDF, PNG, JPG, or WEBP laboratory report.',
      });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorInfo({
        title: 'File is too large',
        message: 'Maximum allowed file size is 10 MB.',
      });
      return;
    }
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setErrorInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [isComplete, setIsComplete] = useState(false);
  const [liveParams, setLiveParams] = useState(DEMO_EXTRACTED_PARAMETERS);
  const progressionTimers = useRef([]);

  const clearProgressionTimers = () => {
    progressionTimers.current.forEach((t) => clearTimeout(t));
    progressionTimers.current = [];
  };

  /* ── Map backend parameters into visual parameter cards ── */
  const mapBackendParams = (params) => {
    if (!params || !Array.isArray(params) || params.length === 0) return DEMO_EXTRACTED_PARAMETERS;
    return params.slice(0, 6).map((p, idx) => {
      const isLow = p.status === 'low';
      const isHigh = p.status === 'high';
      return {
        name: p.name || 'Laboratory Test',
        value: typeof p.value === 'number' ? p.value : (p.value || '—'),
        unit: p.unit || '',
        range: p.reference_range?.raw || 
          (p.reference_range?.low !== undefined && p.reference_range?.high !== undefined 
            ? `${p.reference_range.low} – ${p.reference_range.high} ${p.unit || ''}`.trim()
            : 'Reference range unavailable'),
        status: isLow ? 'low' : isHigh ? 'high' : 'normal',
        iconColor: isLow || isHigh 
          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        minStage: Math.min(4, Math.floor(idx / 2) + 2),
      };
    });
  };

  /* ── Animated progression matching backend pipeline ── */
  const startPipelineProgression = () => {
    clearProgressionTimers();
    setStageIndex(0);
    setIsComplete(false);
    
    // Stages: 0: Upload Complete, 1: Document Validated, 2: Extracting, 3: Reference Ranges, 4: Insights
    const delays = [750, 1600, 2600, 3700];
    delays.forEach((delay, idx) => {
      const t = setTimeout(() => {
        setStageIndex((prev) => (prev >= 0 ? idx + 1 : -1));
      }, delay);
      progressionTimers.current.push(t);
    });
  };

  /* ── Parse structured error from backend ── */
  const parseServerError = (err) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'object' && detail !== null) {
      const isInvalidDoc = detail.error === 'INVALID_DOCUMENT' || detail.is_valid_report === false;
      return {
        isInvalidDocument: isInvalidDoc,
        title: isInvalidDoc ? 'Document Not Recognized' : 'Processing Error',
        document_type: detail.document_type,
        rejection_code: detail.rejection_code,
        message: detail.message || (isInvalidDoc 
          ? 'This file does not appear to be a valid laboratory report. Please upload a clear laboratory document.' 
          : 'We encountered an issue during analysis.'),
        quality: detail.quality_score,
      };
    }
    if (typeof detail === 'string') {
      const isInvalidDoc = detail.toLowerCase().includes('not a lab') || detail.toLowerCase().includes('invalid');
      return {
        isInvalidDocument: isInvalidDoc,
        title: isInvalidDoc ? 'Document Not Recognized' : "Analysis couldn't be completed",
        message: detail,
      };
    }
    return {
      isApiFailure: true,
      title: "Analysis couldn't be completed",
      message: err.response?.data?.message || "We couldn't process this report right now. Please try again.",
    };
  };

  /* ── Smooth sequential stage orchestration ── */
  const runSequentialStages = async (apiPromise) => {
    setProcessing(true);
    setErrorInfo(null);
    setIsComplete(false);
    setStageIndex(0); // Stage 0: Upload Complete

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Stage 0: Upload Complete (700ms)
      await delay(700);

      // Stage 1: Document Validated (900ms)
      setStageIndex(1);
      await delay(900);

      // Stage 2: Extracting Results (1200ms)
      setStageIndex(2);
      await delay(1200);

      // Await real backend API result
      const res = await apiPromise;

      // Stage 3: Checking Reference Ranges (1000ms)
      setStageIndex(3);
      if (res.parameters && res.parameters.length > 0) {
        setLiveParams(mapBackendParams(res.parameters));
      }
      await delay(1000);

      // Stage 4: Preparing Insights (900ms)
      setStageIndex(4);
      await delay(900);

      // Final Completion
      setIsComplete(true);
      await delay(1000);

      navigate(`/reports/${res.id}`);
    } catch (err) {
      const parsed = parseServerError(err);
      setErrorInfo(parsed);
      if (parsed.isInvalidDocument) {
        setStageIndex(1); // Document Validated failed
      } else {
        setStageIndex((prev) => Math.max(1, prev));
      }
    }
  };

  /* ── Submit actual file ── */
  const handleSubmit = async () => {
    if (!file) return;
    await runSequentialStages(reportService.uploadReport(file));
  };

  /* ── Load sample benchmark report ── */
  const handleSample = async (id) => {
    await runSequentialStages(reportService.loadSampleReport(id));
  };

  /* ── Reset flow to upload dropzone ── */
  const resetToUpload = () => {
    setProcessing(false);
    setStageIndex(0);
    setErrorInfo(null);
    setIsComplete(false);
    setLiveParams(DEMO_EXTRACTED_PARAMETERS);
  };

  /* ── IF PROCESSING: RENDER FULL-SCREEN AI PROCESSING SCREEN ── */
  if (processing) {
    return (
      <AIProcessingScreen 
        file={file}
        stageIndex={stageIndex}
        liveParameters={liveParams}
        onRetry={() => {
          if (file) {
            handleSubmit();
          } else {
            handleSample('sample_cbc');
          }
        }}
        onBackToUpload={resetToUpload}
        errorInfo={errorInfo}
        isComplete={isComplete}
      />
    );
  }

  return (
    <div className="w-full min-h-full bg-[#040a19] text-slate-100 selection:bg-cyan-500 selection:text-white pb-20 relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-1/3 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-40 right-10 w-[500px] h-[300px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10 relative z-10">

        {/* ────────────────────────────────────────────────────────────
            1. HERO TITLE & TRUST BADGES
            ──────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          {/* Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-cyan-950/80 border border-cyan-500/30 text-xs font-medium text-cyan-300 shadow-sm shadow-cyan-500/10">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI-Powered Laboratory Report Analysis</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Analyze a Laboratory Report
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-normal">
            Upload your laboratory report and get clear, structured insights with AI.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              <span>Accurate Analysis</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              <span>Evidence-Based</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              <span>Easy to Understand</span>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {errorInfo && (
          <div className="max-w-4xl mx-auto rounded-3xl bg-rose-950/40 border border-rose-600/50 p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-bold text-white">{errorInfo.title}</h3>
                <p className="text-xs sm:text-sm text-rose-200 leading-relaxed">{errorInfo.message}</p>
                {errorInfo.document_type && (
                  <div className="pt-2 flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Detected format:</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase font-mono">
                      {errorInfo.document_type.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={removeFile}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
              >
                Choose Another File
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────
            2. MAIN 3-COLUMN WORKSPACE:
               LEFT: 3D Illuminated Synthetic Report + Floating Callouts
               CENTER: Large Upload Drop Zone
               RIGHT: Supported Report Types
            ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ── LEFT: SYNTHETIC REPORT DOCUMENT & 4 FLOATING CALLOUTS (5 cols) ── */}
          <div className="lg:col-span-5 flex flex-col 2xl:flex-row items-center justify-center gap-4 p-4 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden group">
            
            {/* Ambient behind document */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-cyan-500/5 to-transparent pointer-events-none" />

            {/* Simulated 3D Synthetic Laboratory Report */}
            <div className="relative w-full max-w-[290px] rounded-2xl bg-white text-slate-900 p-4 shadow-2xl shadow-cyan-500/20 border border-slate-200 transform transition-transform group-hover:scale-[1.01] duration-300">
              
              {/* Document Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-1.5">
                  <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    +
                  </div>
                  <span className="font-bold text-xs text-slate-900 tracking-tight">
                    CityCare Diagnostics
                  </span>
                </div>
                <span className="text-[8px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  CBC Panel
                </span>
              </div>

              {/* Patient Details */}
              <div className="py-2 grid grid-cols-2 gap-y-0.5 text-[8px] font-mono text-slate-500 border-b border-slate-100">
                <div>Patient: <span className="font-semibold text-slate-800">Rahul Sharma</span></div>
                <div>Age/Sex: <span className="font-semibold text-slate-800">26 / M</span></div>
                <div>ID: <span className="font-semibold text-slate-800">CCD8226091</span></div>
                <div>Date: <span className="font-semibold text-slate-800">18-Sep-2026</span></div>
              </div>

              {/* Synthetic Tests */}
              <div className="pt-1.5 text-[9px] font-mono">
                <div className="grid grid-cols-4 py-1 text-[7px] text-slate-400 font-sans uppercase font-bold border-b border-slate-100">
                  <span className="col-span-1">Test</span>
                  <span className="text-center">Result</span>
                  <span className="text-center">Ref</span>
                  <span className="text-right">Status</span>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-slate-800 truncate">Hemoglobin</span>
                    <span className="text-center font-bold text-rose-600">11.2</span>
                    <span className="text-center text-slate-400 text-[8px]">13–17</span>
                    <span className="text-right text-rose-600 font-bold text-[8px]">Low</span>
                  </div>

                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-slate-800 truncate">Total WBC</span>
                    <span className="text-center font-bold text-emerald-600">7.4</span>
                    <span className="text-center text-slate-400 text-[8px]">4–11</span>
                    <span className="text-right text-emerald-600 font-bold text-[8px]">Normal</span>
                  </div>

                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-slate-800 truncate">Platelets</span>
                    <span className="text-center font-bold text-emerald-600">245</span>
                    <span className="text-center text-slate-400 text-[8px]">150–450</span>
                    <span className="text-right text-emerald-600 font-bold text-[8px]">Normal</span>
                  </div>

                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-slate-800 truncate">RBC Count</span>
                    <span className="text-center font-bold text-rose-600">4.1</span>
                    <span className="text-center text-slate-400 text-[8px]">4.5–5.9</span>
                    <span className="text-right text-rose-600 font-bold text-[8px]">Low</span>
                  </div>

                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-slate-800 truncate">Hematocrit</span>
                    <span className="text-center font-bold text-rose-600">36.0</span>
                    <span className="text-center text-slate-400 text-[8px]">40–50</span>
                    <span className="text-right text-rose-600 font-bold text-[8px]">Low</span>
                  </div>

                  <div className="grid grid-cols-4 py-1 items-center">
                    <span className="font-medium text-slate-800 truncate">MCV</span>
                    <span className="text-center font-bold text-emerald-600">87.2</span>
                    <span className="text-center text-slate-400 text-[8px]">80–100</span>
                    <span className="text-right text-emerald-600 font-bold text-[8px]">Normal</span>
                  </div>
                </div>
              </div>

              {/* Footer Signature */}
              <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[7px] text-slate-400">
                <span>Verified by Pathologist</span>
                <span className="font-serif italic text-slate-700">Dr. A. Mehta</span>
              </div>

              {/* Glowing Pedestal Base */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-48 h-3 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full blur-sm opacity-60" />
            </div>

            {/* ── 4 Floating Process Callout Cards ── */}
            <div className="flex flex-col space-y-2.5 w-full sm:w-auto">
              
              <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-white text-xs shadow-md">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-semibold">Document Validation</div>
              </div>

              <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-950/80 border border-blue-500/30 text-white text-xs shadow-md">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-semibold">AI Extraction</div>
              </div>

              <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-white text-xs shadow-md">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center flex-shrink-0">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-semibold">Reference Range Check</div>
              </div>

              <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-slate-950/80 border border-purple-500/30 text-white text-xs shadow-md">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-semibold">Clear Insights</div>
              </div>

            </div>

          </div>

          {/* ── CENTER: LARGE UPLOAD DROP ZONE (4 cols) ── */}
          <div className="lg:col-span-4 flex flex-col">
            <div
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition-all duration-300 text-center cursor-pointer relative overflow-hidden ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-2xl shadow-cyan-500/20'
                  : 'border-cyan-500/40 bg-gradient-to-b from-blue-950/40 to-slate-900/80 hover:border-cyan-400/70 hover:bg-blue-950/60 shadow-xl'
              }`}
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={onChange}
              />

              {/* Glowing Aura Icon */}
              <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-5 shadow-lg shadow-cyan-500/20">
                <UploadCloud className="w-10 h-10" />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white mb-1 tracking-tight">
                Drag & drop your laboratory report here
              </h2>
              
              <p className="text-xs text-slate-400 mb-6 font-normal">
                or click to browse files
              </p>

              {/* Choose File Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center space-x-2 cursor-pointer mb-5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Choose File</span>
              </button>

              <p className="text-[11px] text-slate-400 font-mono">
                Supports PDF, JPG, JPEG, PNG (Max 10MB)
              </p>
            </div>
          </div>

          {/* ── RIGHT: SUPPORTED REPORT TYPES CARD (3 cols) ── */}
          <div className="lg:col-span-3 rounded-3xl bg-slate-900/70 border border-white/[0.08] p-5 flex flex-col justify-between backdrop-blur-xl">
            <div className="space-y-3.5">
              
              <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06]">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h2 className="font-bold text-sm text-white tracking-tight">
                  Supported Report Types
                </h2>
              </div>

              <p className="text-[11px] text-slate-400 leading-snug">
                We support most standard laboratory reports including:
              </p>

              {/* List */}
              <ul className="space-y-2 text-xs">
                {SUPPORTED_REPORTS.map((rep) => {
                  const Icon = rep.icon;
                  return (
                    <li key={rep.name} className="flex items-center space-x-2 text-slate-300">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border ${rep.color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-[11px] truncate">{rep.name}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="pt-1 text-[11px] font-semibold text-cyan-400 flex items-center space-x-1">
                <span>And many more...</span>
              </div>

            </div>

            {/* Quick Benchmark Samples */}
            <div className="pt-4 mt-4 border-t border-white/[0.06]">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                Need a test file? Try sample:
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '1', label: 'CBC Blood' },
                  { id: '2', label: 'Lipid' },
                  { id: '3', label: 'CMP' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSample(s.id)}
                    className="px-2 py-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-white/[0.08] text-[10px] font-semibold text-slate-300 hover:text-cyan-300 transition-all text-center cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>


        {/* ────────────────────────────────────────────────────────────
            3. FEATURE CARDS ROW (4 CARDS)
            ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-start space-x-3 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Secure & Private</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Your data is encrypted and never shared.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-start space-x-3 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Smart Validation</p>
              <p className="text-[11px] text-slate-400 mt-0.5">We verify if the document is a laboratory report.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-start space-x-3 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">AI-Powered Analysis</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Extract and analyze laboratory parameters with advanced AI.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-start space-x-3 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Clear Explanations</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Get easy-to-understand insights for your results.</p>
            </div>
          </div>

        </div>


        {/* ────────────────────────────────────────────────────────────
            4. SELECTED FILE & ACTION BAR
            ──────────────────────────────────────────────────────────── */}
        {file && (
          <div className="rounded-3xl bg-slate-900/90 border border-cyan-500/40 p-5 sm:p-6 shadow-2xl shadow-cyan-950/40 flex flex-col md:flex-row items-center justify-between gap-5 animate-fade-in-up">
            
            {/* File Details */}
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-cyan-400/30 flex items-center justify-center flex-shrink-0 text-cyan-300">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <FileText className="w-7 h-7" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Selected File</p>
                <p className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">{file.name}</p>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    {(file.size / 1024).toFixed(0)} KB • {file.name.slice(file.name.lastIndexOf('.')).toUpperCase().replace('.', '')}
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>File ready for analysis</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove selected file"
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/[0.08] hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Action Button */}
            <div className="w-full md:w-auto flex flex-col items-center md:items-end space-y-1">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-xl shadow-cyan-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analyze Report →</span>
              </button>
              <p className="text-[10px] text-slate-400">
                Your report will be securely processed using AI.
              </p>
            </div>

          </div>
        )}


        {/* ────────────────────────────────────────────────────────────
            5. BOTTOM MEDICAL DISCLAIMER
            ──────────────────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start sm:items-center space-x-3 text-xs text-slate-400 max-w-4xl mx-auto">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[11px] leading-relaxed">
            HealthForm AI provides informational and educational assistance only. It does not provide medical diagnosis, treatment, or medical advice. Always consult a qualified healthcare professional for clinical decisions.
          </p>
        </div>

      </div>

    </div>
  );
};

export default UploadPage;

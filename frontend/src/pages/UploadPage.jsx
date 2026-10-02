import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  X,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Lock,
} from 'lucide-react';

/* ─── Processing steps labels (human-readable) ─────── */
const STEPS = [
  { label: 'Reading your document', emoji: '📄' },
  { label: 'Finding your test results', emoji: '🔍' },
  { label: 'Checking reference ranges', emoji: '📊' },
  { label: 'Writing your summary', emoji: '✍️' },
  { label: 'Done!', emoji: '✅' },
];

const UploadPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  /* ── drag helpers ── */
  const onDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) selectFile(e.dataTransfer.files[0]);
  };
  const onChange = (e) => { if (e.target.files?.[0]) selectFile(e.target.files[0]); };

  const selectFile = (f) => {
    setError('');
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.png', '.jpg', '.jpeg'].includes(ext)) {
      setError('Please upload a PDF, PNG, or JPG file.');
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError('File is too large. Maximum size is 15 MB.');
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

  /* ── animated step progression ── */
  const startStepAnimation = () => {
    setStep(0);
    const delays = [800, 1600, 2400, 3200];
    delays.forEach((d, i) => setTimeout(() => setStep(i + 1), d));
  };

  /* ── extract user-friendly message from API error ── */
  const parseError = (err) => {
    const detail = err.response?.data?.detail;
    if (!detail) return err.response?.data?.message || 'Something went wrong. Please try again.';
    // Our INVALID_DOCUMENT 422 response contains a nested message field
    if (typeof detail === 'object' && detail.message) return detail.message;
    if (typeof detail === 'string') return detail;
    return 'Something went wrong. Please try again.';
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!file) return;
    setProcessing(true); setError('');
    startStepAnimation();
    try {
      const res = await reportService.uploadReport(file);
      setTimeout(() => navigate(`/reports/${res.id}`), 3500);
    } catch (err) {
      setProcessing(false); setStep(-1);
      setError(parseError(err));
    }
  };

  /* ── sample loader ── */
  const handleSample = async (id) => {
    setProcessing(true); setError('');
    startStepAnimation();
    try {
      const res = await reportService.loadSampleReport(id);
      setTimeout(() => navigate(`/reports/${res.id}`), 3500);
    } catch (err) {
      setProcessing(false); setStep(-1);
      setError(parseError(err));
    }
  };

  /* ── PROCESSING OVERLAY ── */
  if (processing) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-card border border-white/[0.08] rounded-3xl p-8 space-y-8 text-center animate-fade-in-up">
          <div className="w-20 h-20 mx-auto rounded-full bg-brand-500/15 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Analyzing your report…</h2>
            <p className="text-sm text-slate-400 mt-1">This takes about 10–15 seconds</p>
          </div>

          {/* Steps */}
          <div className="space-y-3 text-left">
            {STEPS.map((s, i) => {
              const done = step > i;
              const current = step === i;
              return (
                <div
                  key={i}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                    done ? 'opacity-100' : current ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <span className="text-xl w-8 text-center">
                    {done ? '✅' : current ? <Loader2 className="w-5 h-5 text-brand-400 animate-spin inline" /> : s.emoji}
                  </span>
                  <span className={`text-sm font-medium ${done ? 'text-emerald-400' : current ? 'text-white' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* progress bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="progress-fill h-full rounded-full"
              style={{ width: `${step < 0 ? 5 : ((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Header */}
      <div className="text-center space-y-2 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Upload Your Lab Report</h1>
        <p className="text-sm text-slate-400">
          We'll read it and explain your results in plain English
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-rose-950/30 border border-rose-800/50 overflow-hidden animate-fade-in-up">
          <div className="flex items-start space-x-3 p-4">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-rose-300">
                We couldn&apos;t process this file
              </p>
              <p className="text-sm text-rose-300/80">{error}</p>
            </div>
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={() => { setError(''); setFile(null); setPreview(null); }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-rose-800/30 hover:bg-rose-800/50 text-rose-300 text-sm font-medium border border-rose-800/40 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Another Report</span>
            </button>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center py-14 px-6 rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer animate-fade-in-up animate-fade-in-up-delay-1 ${
          dragActive
            ? 'border-brand-400 bg-brand-950/30 scale-[1.01]'
            : file
            ? 'border-emerald-500/50 bg-emerald-950/10 cursor-default'
            : 'border-white/[0.12] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={onChange}
        />

        {!file ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-5">
              <UploadCloud className="w-8 h-8 text-brand-400" />
            </div>
            <p className="text-lg font-semibold text-white mb-1">
              Drop your report here
            </p>
            <p className="text-sm text-slate-400 mb-4">
              or <span className="text-brand-400 underline underline-offset-2">browse files</span>
            </p>
            <p className="text-xs text-slate-500">PDF, PNG, JPG — up to 15 MB</p>
          </>
        ) : (
          <div className="w-full space-y-4">
            {/* File info */}
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-900/80 border border-white/[0.07]">
              <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                {file.type.includes('pdf')
                  ? <FileText className="w-6 h-6 text-brand-400" />
                  : <ImageIcon className="w-6 h-6 text-brand-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{file.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image preview */}
            {preview && (
              <div className="max-h-40 overflow-hidden rounded-xl border border-white/[0.07] bg-slate-950">
                <img src={preview} alt="Preview" className="w-full object-contain max-h-40" />
              </div>
            )}

            {/* Submit */}
            <button
              onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
              className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-base shadow-xl shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Analyze My Report</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center space-x-4 animate-fade-in-up animate-fade-in-up-delay-2">
        <div className="flex-1 h-px bg-white/[0.07]" />
        <span className="text-xs text-slate-500 px-2">Or try a sample report</span>
        <div className="flex-1 h-px bg-white/[0.07]" />
      </div>

      {/* Sample buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in-up animate-fade-in-up-delay-3">
        {[
          { id: '1', emoji: '🩸', label: 'Blood Test' },
          { id: '2', emoji: '🫀', label: 'Lipid Panel' },
          { id: '3', emoji: '📊', label: 'Follow-up' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => handleSample(s.id)}
            className="flex items-center justify-center space-x-2 p-3 rounded-2xl bg-slate-900/60 border border-white/[0.07] hover:border-white/[0.15] hover:bg-slate-900 transition-all text-sm font-medium text-slate-300 hover:text-white"
          >
            <span className="text-xl">{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Privacy note */}
      <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 animate-fade-in-up">
        <Lock className="w-3.5 h-3.5" />
        <span>Your file is processed securely and never shared.</span>
      </div>

    </div>
  );
};

export default UploadPage;

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import ProcessingTracker from '../components/upload/ProcessingTracker';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';

const UploadPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setError('');
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      setError(`Invalid file format '${ext}'. Please upload PDF, PNG, JPG, or JPEG.`);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File exceeds maximum size limit of 15MB.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const executePipelineProgress = () => {
    // Progress tracker animation through the 8 stages
    setCurrentStage(0);
    const intervals = [
      setTimeout(() => setCurrentStage(1), 300),  // Reading document
      setTimeout(() => setCurrentStage(2), 700),  // Extracting info
      setTimeout(() => setCurrentStage(3), 1100), // Validating
      setTimeout(() => setCurrentStage(4), 1500), // Analyzing ranges
      setTimeout(() => setCurrentStage(5), 1900), // Generating explanation
      setTimeout(() => setCurrentStage(6), 2300), // Verifying claims
      setTimeout(() => setCurrentStage(7), 2700), // Complete
    ];
    return intervals;
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setError('');
    
    const intervals = executePipelineProgress();

    try {
      const res = await reportService.uploadReport(selectedFile);
      setTimeout(() => {
        navigate(`/reports/${res.id}`);
      }, 3000);
    } catch (err) {
      intervals.forEach(clearTimeout);
      setIsProcessing(false);
      setError(err.response?.data?.detail || 'Document processing failed. Please try again.');
    }
  };

  const handleSampleSelect = async (sampleId) => {
    setIsProcessing(true);
    setError('');
    const intervals = executePipelineProgress();
    try {
      const res = await reportService.loadSampleReport(sampleId);
      setTimeout(() => {
        navigate(`/reports/${res.id}`);
      }, 3000);
    } catch (err) {
      intervals.forEach(clearTimeout);
      setIsProcessing(false);
      setError(err.response?.data?.detail || 'Sample processing failed.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Upload Laboratory Document
        </h1>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Submit laboratory reports in PDF or scanned image format. The system executes extraction, validation, 
          RAG grounding, and claim verification in a single transparent pipeline.
        </p>
      </div>

      {/* 8-Stage Tracker */}
      {isProcessing && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <ProcessingTracker currentStage={currentStage} />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone & Previews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Dropzone (2 cols) */}
        <div className="md:col-span-2">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`glass-card rounded-2xl p-8 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-brand-400 bg-brand-950/30' 
                : 'border-slate-700/80 hover:border-slate-600 hover:bg-slate-900/60'
            } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">
              Drag and drop your report here, or <span className="text-brand-400 underline">browse</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Supported Formats: PDF, PNG, JPG, JPEG (Max 15MB)
            </p>

            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grounded reference-range parsing • Local research processing</span>
            </div>
          </div>

          {/* Selected File Card */}
          {selectedFile && (
            <div className="mt-4 p-4 rounded-xl glass-card border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400">
                  {selectedFile.type.includes('pdf') ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                  disabled={isProcessing}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white flex items-center space-x-1.5 shadow-md shadow-brand-600/20 transition-all"
                >
                  <span>{isProcessing ? 'Processing...' : 'Execute Analysis'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* File Image Preview if applicable */}
          {filePreview && (
            <div className="mt-4 p-3 rounded-xl glass-card border border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Visual Document Preview</p>
              <div className="max-h-56 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center">
                <img src={filePreview} alt="Report Preview" className="object-contain max-h-56 w-full" />
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Synthetic Benchmark Samples Card (1 col) */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Instant Benchmark Samples
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Don't have a report handy? Test the full pipeline with one click using certified synthetic benchmark documents:
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => handleSampleSelect("1")}
                disabled={isProcessing}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-brand-500/50 text-left transition-all text-xs"
              >
                <p className="font-semibold text-slate-200">Sample 1: Routine CBC + CMP</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Hemoglobin 11.2 (Low), Glucose 118 (High)</p>
                <span className="text-[10px] text-brand-400 font-mono mt-1 inline-block">→ Test Complete Panel</span>
              </button>

              <button
                onClick={() => handleSampleSelect("2")}
                disabled={isProcessing}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left transition-all text-xs"
              >
                <p className="font-semibold text-slate-200">Sample 2: Lipid & Hepatic Panel</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Cholesterol 235 (High), ALT 58 (High)</p>
                <span className="text-[10px] text-amber-400 font-mono mt-1 inline-block">→ Test Lipid Profile</span>
              </button>

              <button
                onClick={() => handleSampleSelect("3")}
                disabled={isProcessing}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left transition-all text-xs"
              >
                <p className="font-semibold text-slate-200">Sample 3: Longitudinal Follow-up</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Follow-up for Patient A after 5 weeks</p>
                <span className="text-[10px] text-emerald-400 font-mono mt-1 inline-block">→ Test Follow-up Report</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <span className="font-semibold text-slate-300">Data Privacy Assurance:</span>
            <p>Uploaded documents are processed locally. No clinical data is shared with public model training or third-party brokers.</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default UploadPage;

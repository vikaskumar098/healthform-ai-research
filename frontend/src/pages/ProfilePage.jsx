import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, LogOut, Shield, UploadCloud, FileText } from 'lucide-react';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Profile</h1>
        <p className="text-sm text-slate-400 mt-1">Your account information</p>
      </div>

      {/* Profile card */}
      <div className="glass-card border border-white/[0.07] rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-in-up animate-fade-in-up-delay-1">
        {/* Avatar */}
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-brand-500/30 flex-shrink-0">
            {(user.full_name || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.full_name || 'User'}</h2>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-900/60">
            <User className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Full Name</p>
              <p className="text-sm text-slate-200 mt-0.5">{user.full_name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-900/60">
            <Mail className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Email Address</p>
              <p className="text-sm text-slate-200 mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="space-y-3 animate-fade-in-up animate-fade-in-up-delay-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-white/[0.12] hover:bg-slate-900 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Upload Report</p>
              <p className="text-xs text-slate-400 mt-0.5">Analyze a new lab report</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-white/[0.12] hover:bg-slate-900 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">My Reports</p>
              <p className="text-xs text-slate-400 mt-0.5">View past results</p>
            </div>
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start space-x-3 p-4 rounded-2xl bg-slate-900/40 border border-white/[0.05] text-xs text-slate-500 animate-fade-in-up">
        <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p>Your data is stored securely and never shared with third parties. HealthForm AI does not provide medical diagnoses.</p>
      </div>

      {/* Sign out */}
      <div className="animate-fade-in-up">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-rose-950/30 hover:bg-rose-950/50 text-rose-400 border border-rose-900/50 text-sm font-medium transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
};

export default ProfilePage;

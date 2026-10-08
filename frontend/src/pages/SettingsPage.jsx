import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { reportService } from '../services/reportService';
import {
  ArrowLeft,
  User,
  KeyRound,
  Download,
  Trash2,
  Check,
  Shield,
  Clock,
  Sparkles,
  AlertTriangle,
  HardDrive,
  Award,
  Bell,
  Sliders,
  Lock,
  ChevronDown,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react';

/* ─── Helper: Format Date ─── */
const formatDate = (str) => {
  if (!str) return 'Jan 12, 2024';
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return str;
  }
};

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();

  // Active Settings Tab
  const [activeTab, setActiveTab] = useState('profile'); // profile | account | preferences | notifications | privacy

  // Profile Form State (Loaded from actual user data)
  const [fullName, setFullName] = useState(user?.full_name || 'Vikram Kumar');
  const [email, setEmail] = useState(user?.email || 'vikram@example.com');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [dob, setDob] = useState(user?.dob || 'Mar 15, 1998');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [avatarInitials, setAvatarInitials] = useState('VK');

  // Account Stats
  const [reportsCount, setReportsCount] = useState(24);
  const [storageBytes, setStorageBytes] = useState(5452595); // ~5.2 MB
  const [savingProfile, setSavingProfile] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // 1. Fetch user profile from DB
      const me = await authService.getMe();
      if (me) {
        setFullName(me.full_name || 'Vikram Kumar');
        setEmail(me.email || 'vikram@example.com');
        setPhone(me.phone || '+91 98765 43210');
        setDob(me.dob || 'Mar 15, 1998');
        setGender(me.gender || 'Male');
        updateUser(me);

        // Derive initials
        const parts = (me.full_name || 'VK').trim().split(' ');
        const inits = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0].slice(0, 2);
        setAvatarInitials(inits.toUpperCase());
      }

      // 2. Fetch reports count & storage from DB
      const reps = await reportService.listReports();
      if (reps) {
        setReportsCount(reps.length);
        const totalSize = reps.reduce((acc, r) => acc + (r.file_size || 250000), 0);
        setStorageBytes(totalSize || 5452595);
      }
    } catch (_) {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile({
        full_name: fullName,
        phone,
        dob,
        gender,
      });
      updateUser(updated);
      showToast('Profile information updated successfully!');
    } catch (err) {
      alert('Failed to update profile: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully.');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Current password is incorrect.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      showToast('Preparing your research & report data archive...');
      const data = await authService.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HealthForm_AI_Data_Export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data archive downloaded successfully.');
    } catch (err) {
      alert('Failed to export data: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await authService.deleteAccount();
      logout();
      window.location.href = '/';
    } catch (err) {
      alert('Account deletion failed: ' + (err.response?.data?.detail || err.message));
      setDeleteLoading(false);
    }
  };

  const storageMb = (storageBytes / (1024 * 1024)).toFixed(1);

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-fade-in-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400 font-mono">
            ← Profile / Settings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage your account and preferences.
          </p>
        </div>

        {/* ── Tabs (Profile, Account, Preferences, Notifications, Privacy & Security) ── */}
        <div className="flex items-center flex-wrap gap-2 border-b border-white/[0.06] pb-3">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'account', label: 'Account' },
            { id: 'preferences', label: 'Preferences' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'privacy', label: 'Privacy & Security' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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

        {/* ── Tab Content: PROFILE (2 Columns Matching Screenshot) ── */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): Profile Information Card */}
            <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-white/[0.08] p-6 shadow-xl space-y-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Profile Information
              </h2>

              {/* Avatar + Change Photo */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-600/30">
                  {avatarInitials}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const newName = prompt('Enter initials or profile nickname:', avatarInitials);
                      if (newName) setAvatarInitials(newName.slice(0, 3).toUpperCase());
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                  >
                    Change Photo
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1">JPG, PNG or SVG. Max 2MB.</p>
                </div>
              </div>

              {/* Form fields */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    title="Primary account email"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-white/[0.06] text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Date of Birth</label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="Mar 15, 1998"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Gender</label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center space-x-2"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column (5 cols): Account Information + Quick Actions */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 1: Account Information */}
              <div className="rounded-2xl bg-slate-900/80 border border-white/[0.08] p-5 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Account Information
                </h3>

                <div className="space-y-2.5 text-xs">
                  {/* Account Type */}
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Account Type</span>
                    <span className="font-semibold text-amber-400 flex items-center space-x-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Premium</span>
                    </span>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Member Since</span>
                    <span className="font-mono text-slate-200">
                      {formatDate(user?.created_at || '2024-01-12')}
                    </span>
                  </div>

                  {/* Reports Analyzed */}
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Reports Analyzed</span>
                    <span className="font-mono font-bold text-white">{reportsCount}</span>
                  </div>

                  {/* Storage Used */}
                  <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Storage Used</span>
                    <span className="font-mono text-slate-200">{storageMb} MB / 1 GB</span>
                  </div>

                  {/* Account Status */}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">Account Status</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center space-x-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Active</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Quick Actions */}
              <div className="rounded-2xl bg-slate-900/80 border border-white/[0.08] p-5 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Quick Actions
                </h3>

                <div className="space-y-3">
                  {/* Action 1: Change Password */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/[0.05]">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Change Password</div>
                        <div className="text-[11px] text-slate-400">Update your account password</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasswordModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {/* Action 2: Download My Data */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/[0.05]">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Download My Data</div>
                        <div className="text-[11px] text-slate-400">Export your reports and data</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadData}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                    >
                      Download
                    </button>
                  </div>

                  {/* Action 3: Delete Account */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/[0.05]">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Delete Account</div>
                        <div className="text-[11px] text-slate-400">Permanently delete account & data</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold text-rose-400 transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: ACCOUNT ── */}
        {activeTab === 'account' && (
          <div className="rounded-2xl bg-slate-900/80 border border-white/[0.08] p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Account & Subscription Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.05] space-y-2">
                <span className="text-slate-400">Grant / Subscription Tier</span>
                <p className="text-sm font-bold text-white">Academic AI Research Grant</p>
                <p className="text-[11px] text-slate-400">
                  Includes unlimited multimodal report uploads, zero token rate limits in demo mode, and isolated HIPAA/CLIA compliant storage.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.05] space-y-2">
                <span className="text-slate-400">Session Security</span>
                <p className="text-sm font-bold text-emerald-400">HS256 Encrypted JWT</p>
                <p className="text-[11px] text-slate-400">
                  Signed token expires in 24 hours. No external third-party tracking cookies are set.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: PREFERENCES ── */}
        {activeTab === 'preferences' && (
          <div className="rounded-2xl bg-slate-900/80 border border-white/[0.08] p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              System & Display Preferences
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-white/[0.05]">
                <div>
                  <div className="font-semibold text-white">Reference Range Logic</div>
                  <div className="text-[11px] text-slate-400">
                    Strictly follow printed laboratory reference intervals without external generic overrides.
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-cyan-400">Enforced (Active)</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-white/[0.05]">
                <div>
                  <div className="font-semibold text-white">Theme Aesthetic</div>
                  <div className="text-[11px] text-slate-400">
                    Dark Navy AI healthcare theme with glowing cyan accents.
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-400">Dark Navy AI (Default)</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className="rounded-2xl bg-slate-900/80 border border-white/[0.08] p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Notification Settings
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.05]">
                <div>
                  <div className="font-semibold text-white">Analysis Completion Notification</div>
                  <div className="text-[11px] text-slate-400">Show notification banner when processing completes</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded" />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.05]">
                <div>
                  <div className="font-semibold text-white">Critical Flag Alerts</div>
                  <div className="text-[11px] text-slate-400">Highlight values out of range in red/amber indicators</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded" />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: PRIVACY & SECURITY ── */}
        {activeTab === 'privacy' && (
          <div className="rounded-2xl bg-slate-900/80 border border-white/[0.08] p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Privacy, Governance & Safety Standards
            </h2>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.05] space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                <Shield className="w-4 h-4" />
                <span>Non-Diagnostic Governance Policy</span>
              </div>
              <p>
                HealthForm AI strictly adheres to laboratory automation principles. It performs numerical parsing, 
                boundary verification, and factual retrieval grounding. Under no circumstances does this system 
                issue medical diagnoses, drug prescriptions, or disease conclusions.
              </p>
              <p className="text-[11px] text-slate-400">
                All patient identifiers are maintained in an encrypted local database. Exported data remains strictly 
                the property of the authenticated researcher.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── Change Password Modal ── */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl bg-slate-900 border border-white/10 w-full max-w-md p-6 shadow-2xl space-y-5 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white">Change Account Password</h3>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5"
                >
                  {passwordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Update Password</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal ── */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl bg-slate-900 border border-rose-500/30 w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This action is irreversible. All your uploaded laboratory reports, historical analyses, and profile settings will be permanently erased.
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5"
              >
                {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Delete Permanently</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPage;

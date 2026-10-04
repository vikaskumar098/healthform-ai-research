import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ReportAnalysisPage from './pages/ReportAnalysisPage';
import HistoricalComparisonPage from './pages/HistoricalComparisonPage';
import ResearchDashboardPage from './pages/ResearchDashboardPage';
import ReportHistoryPage from './pages/ReportHistoryPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

// Protected Route: redirects unauthenticated users to login
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Allow access (demo mode or authenticated)
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Standalone Auth Pages — Dedicated authentication experience without global website navbar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main Website and Dashboard routes with AppLayout */}
      <Route element={<AppLayout />}>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected — core user journey */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute><ReportAnalysisPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><ReportHistoryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/comparison" element={<ProtectedRoute><HistoricalComparisonPage /></ProtectedRoute>} />

        {/* Advanced / research pages (kept but not in main nav) */}
        <Route path="/research" element={<ProtectedRoute><ResearchDashboardPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

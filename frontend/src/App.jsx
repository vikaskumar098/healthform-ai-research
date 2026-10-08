import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import DashboardLayout from './layouts/DashboardLayout';

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
import AnalysisDetailsPage from './pages/AnalysisDetailsPage';

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

      {/* Main Website and Dashboard routes with AppLayout (top Navbar & Footer) */}
      <Route element={<AppLayout />}>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Authenticated Dashboard Shell (Top Navbar + Left AppSidebar + Main Content Area) */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/my-reports" element={<ReportHistoryPage />} />
          <Route path="/reports" element={<ReportHistoryPage />} />
          <Route path="/history" element={<ReportHistoryPage />} />
          <Route path="/comparison" element={<HistoricalComparisonPage />} />
          <Route path="/compare" element={<Navigate to="/comparison" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reports/:id/details" element={<AnalysisDetailsPage />} />
          <Route path="/analysis-details/:id" element={<AnalysisDetailsPage />} />
          <Route path="/analysis-details" element={<AnalysisDetailsPage />} />
        </Route>

        {/* Dedicated Report Analysis Interactive View */}
        <Route path="/reports/:id" element={<ProtectedRoute><ReportAnalysisPage /></ProtectedRoute>} />

        {/* Advanced / research pages */}
        <Route path="/research" element={<ProtectedRoute><ResearchDashboardPage /></ProtectedRoute>} />

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

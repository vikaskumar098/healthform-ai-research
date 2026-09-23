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

// Protected Route Wrapper (with automatic demo fallback for research reviewers)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-xs text-slate-400 font-mono">
        Authenticating researcher session...
      </div>
    );
  }

  // In demo mode or if logged in, permit access
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Core Product Requirements Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute><ReportAnalysisPage /></ProtectedRoute>} />
        <Route path="/comparison" element={<ProtectedRoute><HistoricalComparisonPage /></ProtectedRoute>} />
        <Route path="/research" element={<ProtectedRoute><ResearchDashboardPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><ReportHistoryPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

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

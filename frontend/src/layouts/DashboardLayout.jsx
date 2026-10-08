import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '../components/common/AppSidebar';

/**
 * DashboardLayout
 * Provides the consistent authenticated dashboard application shell:
 * - Left sticky AppSidebar navigation
 * - Responsive main content area for dashboard, upload, reports, history, settings, etc.
 * The top Navbar is provided by the outer AppLayout wrapper.
 */
const DashboardLayout = () => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 relative">
      {/* ── Left Sidebar ── */}
      <AppSidebar />

      {/* ── Main Dashboard Content Shell ── */}
      <div className="flex-1 min-w-0 w-full overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;

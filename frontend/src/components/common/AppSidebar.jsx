import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Clock,
  BarChart2,
  User,
  Settings,
  ChevronRight,
} from 'lucide-react';

const AppSidebar = ({ currentActive = '' }) => {
  const location = useLocation();
  const path = location.pathname;

  const isOverview = currentActive === 'overview' || path === '/dashboard';
  const isUpload = currentActive === 'upload' || path === '/upload' || path.startsWith('/upload/');
  const isMyReports =
    currentActive === 'my-reports' ||
    currentActive === 'reports' ||
    path === '/reports' ||
    path === '/my-reports' ||
    (path.startsWith('/reports/') && !path.includes('comparison'));
  const isHistory = currentActive === 'history' || path === '/history' || path.startsWith('/history/');
  const isCompare =
    currentActive === 'compare' ||
    path === '/compare' ||
    path.startsWith('/compare') ||
    path === '/comparison' ||
    path.startsWith('/comparison');
  const isProfile = currentActive === 'profile' || path === '/profile' || path.startsWith('/profile/');
  const isSettings = currentActive === 'settings' || path === '/settings' || path.startsWith('/settings/');

  const mainNav = [
    {
      id: 'overview',
      name: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      active: isOverview,
    },
    {
      id: 'upload',
      name: 'Upload Report',
      path: '/upload',
      icon: UploadCloud,
      active: isUpload,
    },
    {
      id: 'my-reports',
      name: 'My Reports',
      path: '/my-reports',
      icon: FileText,
      active: isMyReports,
    },
    {
      id: 'history',
      name: 'History',
      path: '/history',
      icon: Clock,
      active: isHistory,
    },
    {
      id: 'compare',
      name: 'Compare Reports',
      path: '/comparison',
      icon: BarChart2,
      active: isCompare,
    },
  ];

  const bottomNav = [
    {
      id: 'profile',
      name: 'Profile',
      path: '/profile',
      icon: User,
      active: isProfile,
    },
    {
      id: 'settings',
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      active: isSettings,
    },
  ];

  return (
    <aside
      aria-label="Sidebar navigation"
      className="hidden lg:flex flex-col justify-between w-60 flex-shrink-0 bg-slate-950/70 border-r border-white/[0.06] p-4 sticky top-16 h-[calc(100vh-4rem)] z-20 backdrop-blur-xl"
    >
      {/* Top Nav Items */}
      <div className="space-y-1.5">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Nav Items */}
      <div className="space-y-1.5 pt-4 border-t border-white/[0.06]">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default AppSidebar;

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Activity, 
  UploadCloud, 
  LayoutDashboard, 
  History, 
  GitCompare, 
  FlaskConical, 
  Settings, 
  LogOut, 
  LogIn, 
  UserPlus, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Report', path: '/upload', icon: UploadCloud },
    { name: 'Report History', path: '/history', icon: History },
    { name: 'Historical Comparison', path: '/comparison', icon: GitCompare },
    { name: 'Research & Evaluation', path: '/research', icon: FlaskConical },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg text-white tracking-tight">HealthForm</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Explainable Lab Understanding</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive 
                        ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Header Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Demo Mode Badge */}
            <div className="flex items-center space-x-1.5 text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Demo / Research Mode</span>
            </div>

            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <Link
                  to="/settings"
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Settings & System Diagnostics"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-200">{user.full_name || 'Researcher'}</p>
                  <p className="text-[10px] text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          {user ? (
            <>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"
                  >
                    <Icon className="w-4 h-4 text-brand-400" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-400 hover:underline flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 text-sm text-slate-200 bg-slate-800 rounded-lg"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 text-sm text-white bg-brand-600 rounded-lg font-medium"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

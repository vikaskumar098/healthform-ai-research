import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, UploadCloud, FileText, User, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = user
    ? [
        { name: 'Upload Report', path: '/upload', icon: UploadCloud },
        { name: 'My Reports', path: '/history', icon: FileText },
      ]
    : [];

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center space-x-3 group" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">HealthForm</span>
              <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30 align-middle">AI</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-brand-500/15 text-brand-300 border border-brand-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-sm transition-all ${
                    isActive('/profile')
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                    {(user.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
                    {user.full_name || user.email}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-lg shadow-brand-600/25"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-950 border-b border-white/[0.06] px-4 pb-4 pt-2 space-y-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-brand-500/15 text-brand-300'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          {user ? (
            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                <span>{user.full_name || user.email}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-center px-4 py-2.5 rounded-xl text-sm text-slate-200 bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block text-center px-4 py-2.5 rounded-xl text-sm text-white font-semibold bg-brand-600 hover:bg-brand-500 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

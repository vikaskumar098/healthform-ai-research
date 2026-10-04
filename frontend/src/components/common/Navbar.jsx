import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UploadCloud, FileText, User, LogOut, Menu, X, Sparkles, BookOpen } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import HealthFormLogo from './HealthFormLogo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', isHash: false },
    { name: 'How It Works', path: '/#how-it-works', isHash: true },
    { name: 'Features', path: '/#features', isHash: true },
    { name: 'Research', path: '/research', isHash: false },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const handleNavClick = (link) => {
    setMobileOpen(false);
    if (link.isHash) {
      if (location.pathname === '/') {
        const id = link.path.replace('/#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate(link.path);
      }
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/#')) return false;
    return location.pathname === path;
  };

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 animate-fade-in ${
      scrolled
        ? 'bg-slate-950/95 border-white/[0.10] shadow-xl shadow-slate-950/50'
        : 'bg-slate-950/85 border-white/[0.06]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <Link
            to={user ? '/dashboard' : '/'}
            className="flex items-center group transition-opacity hover:opacity-90"
            onClick={() => setMobileOpen(false)}
            aria-label="HealthForm AI Home"
          >
            <HealthFormLogo variant="compact" size="md" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              if (link.isHash) {
                return (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => handleNavClick(link)}
                    className="px-3.5 py-1.5 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                  >
                    {link.name}
                  </button>
                );
              }
              const isCurrent = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isCurrent
                      ? 'text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <span>{link.name}</span>
                  {isCurrent && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-2.5">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => navigate('/history')}
              aria-label="Search reports"
              className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Search reports"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Reports Pill Button */}
            <Link
              to="/history"
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                location.pathname === '/history'
                  ? 'bg-blue-600/30 border-cyan-400 text-cyan-200'
                  : 'bg-white/[0.04] border-white/10 text-slate-200 hover:bg-white/[0.08] hover:text-white hover:border-white/20'
              }`}
            >
              Reports
            </Link>

            {/* Notifications Bell with Badge */}
            <button
              type="button"
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              title="1 new notification"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]" />
            </button>

            {/* User Avatar & Dropdown */}
            {user ? (
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center space-x-1.5 pl-1.5 pr-2 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-cyan-500/20">
                    {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'VK'}
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl py-2 backdrop-blur-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-2 border-b border-white/[0.06]">
                    <p className="text-xs font-semibold text-white truncate">{user.full_name || 'Vikas Kumar'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email || 'user@healthform.ai'}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/history"
                    className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>All Reports</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white transition-all shadow-md shadow-blue-500/25"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-white/[0.08] px-4 pb-5 pt-2 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            if (link.isHash) {
              return (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => handleNavClick(link)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  {link.name}
                </button>
              );
            }
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
                {Icon && <Icon className="w-4 h-4" />}
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
            <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="text-center px-4 py-2.5 rounded-xl text-sm text-slate-200 bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="text-center px-4 py-2.5 rounded-xl text-sm text-white font-semibold bg-brand-600 hover:bg-brand-500 transition-colors shadow-lg shadow-brand-600/30"
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

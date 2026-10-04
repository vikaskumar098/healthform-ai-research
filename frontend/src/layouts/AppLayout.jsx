import React, { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const AppLayout = () => {
  const location = useLocation();
  const mainRef = useRef(null);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Trigger page-enter animation on every route change
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.classList.remove('page-enter');
    // Force reflow
    void el.offsetWidth;
    el.classList.add('page-enter');
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  if (isAuthPage) {
    return (
      <main className="min-h-screen">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-brand-500 selection:text-white">
      <Navbar />
      <main ref={mainRef} className="flex-grow page-enter">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;


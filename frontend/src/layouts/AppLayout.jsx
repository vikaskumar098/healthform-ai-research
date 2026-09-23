import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-brand-500 selection:text-white">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;

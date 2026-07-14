'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Menu, ShieldCheck, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/reset-password';

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isPublicPage) {
        router.push('/login');
      } else if (user && (pathname === '/login' || pathname === '/register')) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, isPublicPage, pathname, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
        .catch((err) => console.error('Service Worker registration failed:', err));
    }
  }, []);

  // Wait for loading to finish to prevent flash of content
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400 tracking-wider">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  // If we are on a public page, render directly
  if (isPublicPage) {
    return <>{children}</>;
  }

  // If not logged in and not public page, redirecting (render spinner)
  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar navigation */}
      <div className="print:hidden">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      </div>

      {/* Main Content Area */}
      <div className="md:pl-64 transition-all duration-300 print:pl-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-20 shadow-md print:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-350 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <span className="text-md font-bold tracking-wider bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            ARAFAT COMPTA
          </span>

          <div className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            {user.role === 'admin' ? (
              <ShieldCheck size={14} className="text-emerald-400" />
            ) : (
              <UserCheck size={14} className="text-amber-400" />
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider">
              {user.role === 'admin' ? 'Admin' : 'Vendeur'}
            </span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto print:p-0 print:max-w-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

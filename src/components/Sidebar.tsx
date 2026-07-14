'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Boxes,
  ArrowUpRight,
  TrendingDown,
  ShoppingCart,
  Receipt,
  Wallet,
  Truck,
  FileSpreadsheet,
  Users,
  CircleDollarSign,
  FileBarChart2,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [butcheryName, setButcheryName] = useState('ARAFAT COMPTA');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const name = window.localStorage.getItem('boucherie_name');
      if (name) setButcheryName(name);
      const logo = window.localStorage.getItem('boucherie_logo');
      if (logo) setCompanyLogo(logo);
    }
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'vendeur'] },
    { name: 'Stock au Frigo', path: '/stock', icon: Boxes, roles: ['admin', 'vendeur'] },
    { name: 'Sortie du Frigo Début de Journée', path: '/sorties', icon: ArrowUpRight, roles: ['admin', 'vendeur'] },
    { name: 'Stock Restant Fin de Journée', path: '/stock-restant', icon: TrendingDown, roles: ['admin', 'vendeur'] },
    { name: 'Ventes', path: '/ventes', icon: ShoppingCart, roles: ['admin', 'vendeur'] },
    { name: 'Dépenses', path: '/depenses', icon: Receipt, roles: ['admin', 'vendeur'] },
    { name: 'Caisse', path: '/caisse', icon: Wallet, roles: ['admin', 'vendeur'] },
    { name: 'Fournisseurs', path: '/fournisseurs', icon: Truck, roles: ['admin', 'vendeur'] },
    { name: 'Dettes aux Fournisseurs', path: '/dettes', icon: FileSpreadsheet, roles: ['admin', 'vendeur'] },
    { name: 'Employés', path: '/employes', icon: Users, roles: ['admin'] },
    { name: 'Salaires', path: '/salaires', icon: CircleDollarSign, roles: ['admin'] },
    { name: 'Rapports', path: '/rapports', icon: FileBarChart2, roles: ['admin'] },
    { name: 'Paramètres', path: '/parametres', icon: Settings, roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || 'vendeur'));

  const handleLinkClick = (path: string) => {
    setMobileOpen(false);
    router.push(path);
  };

  const handleRoleToggle = () => {
    if (!user) return;
    const nextRole = user.role === 'admin' ? 'vendeur' : 'admin';
    switchRole(nextRole);
    router.refresh();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 dark:bg-slate-950 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-850 h-16">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg text-slate-900 flex items-center justify-center shrink-0 w-9 h-9">
            {companyLogo ? (
              <img src={companyLogo} className="w-8 h-8 object-contain rounded" alt="Logo" />
            ) : (
              <Boxes className="h-5 w-5 font-bold" />
            )}
          </div>
          {(!isCollapsed || mobileOpen) && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg font-bold tracking-wider bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent uppercase truncate max-w-[170px]"
            >
              {butcheryName}
            </motion.span>
          )}
        </div>

        {/* Desktop Collapse Button */}
        {!mobileOpen && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}

        {/* Mobile Close Button */}
        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Menu List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredItems.map(item => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => handleLinkClick(item.path)}
              className={`flex items-center w-full px-3 py-3 rounded-xl transition-all duration-200 group text-left ${
                isActive 
                  ? 'bg-emerald-600 text-pure-white font-medium shadow-md shadow-emerald-900/20' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-350'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-pure-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
              {(!isCollapsed || mobileOpen) && (
                <span className="ml-3 text-sm tracking-wide font-light">{item.name}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Test Settings & Actions Footer */}
      <div className="p-4 border-t border-slate-850 bg-slate-900/60 dark:bg-slate-950/60 space-y-4">
        {/* Active Role Card */}
        {(!isCollapsed || mobileOpen) && (
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Session Actuelle</span>
              <div className="flex items-center space-x-1">
                {user?.role === 'admin' ? (
                  <ShieldCheck size={14} className="text-emerald-400" />
                ) : (
                  <UserCheck size={14} className="text-amber-400" />
                )}
                <span className={`text-[10px] uppercase font-bold tracking-wider ${user?.role === 'admin' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {user?.role === 'admin' ? 'Admin' : 'Vendeur'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-700/30">
              {user?.avatar ? (
                <img src={user.avatar} className="h-8 w-8 rounded-full object-cover border border-slate-600 shrink-0" alt="Avatar" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0 border border-slate-700">
                  {user?.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-slate-300">{user?.fullName}</p>
                <p className="text-[9px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            
            {/* Quick switcher for testing - Admin only */}
            {user?.role === 'admin' && (
              <button 
                onClick={handleRoleToggle}
                className="text-[10px] text-center w-full mt-1.5 py-1 px-2 rounded bg-slate-700 hover:bg-slate-650 hover:text-white font-medium transition-all duration-150 uppercase tracking-wider"
              >
                Tester Rôle Vendeur
              </button>
            )}
          </div>
        )}

        {/* Global Toolbar */}
        <div className="flex items-center justify-between">
          {/* Theme Selector */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Collapsed Role Icon Trigger (Admin only) */}
          {isCollapsed && !mobileOpen && user?.role === 'admin' && (
            <button
              onClick={handleRoleToggle}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-emerald-400"
              title="Basculer en Vendeur"
            >
              <ShieldCheck size={18} />
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center justify-center p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={18} />
            {(!isCollapsed || mobileOpen) && <span className="ml-2 text-xs font-medium">Quitter</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside 
        className={`hidden md:block h-screen fixed top-0 left-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-72 z-50 shadow-xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

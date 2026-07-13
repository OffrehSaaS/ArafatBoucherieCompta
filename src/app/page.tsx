'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Boxes, 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Layers, 
  Wallet, 
  ArrowUpRight 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden p-6 md:p-12 select-none">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section Container */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LEFT: Branding & Description & Mockup */}
        <div className="lg:col-span-7 space-y-8 flex flex-col justify-center">
          {/* Logo & Brand */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl shadow-inner">
              <Boxes size={28} className="animate-pulse" />
            </div>
            <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ARAFAT COMPTA
            </span>
          </motion.div>

          {/* Slogan */}
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]"
            >
              Simplifiez la gestion <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                comptable de votre boucherie.
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base text-slate-400 font-light leading-relaxed max-w-lg"
            >
              Remplacez définitivement le cahier papier traditionnel. Suivez les stocks restants, 
              les encaissements de ventes, les charges opérationnelles, les salaires du personnel 
              et vos bénéfices nets en temps réel.
            </motion.p>
          </div>

          {/* Features Grid Icons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div className="flex items-center space-x-2 text-xs text-slate-350 font-medium">
              <Layers size={14} className="text-emerald-400" />
              <span>Stocks & Ventes</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-350 font-medium">
              <Wallet size={14} className="text-emerald-400" />
              <span>Caisse & Dépenses</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-350 font-medium">
              <Users size={14} className="text-emerald-400" />
              <span>Planning & Salaires</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-350 font-medium">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Rapports & Audit</span>
            </div>
          </motion.div>

          {/* Visual Mockup Placeholder */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden sm:block relative w-full h-[220px] bg-slate-900/50 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl p-4 backdrop-blur-md"
          >
            {/* Window bar */}
            <div className="flex items-center space-x-1.5 pb-3.5 border-b border-slate-850/50">
              <div className="w-2.5 h-2.5 bg-rose-500/40 rounded-full" />
              <div className="w-2.5 h-2.5 bg-amber-500/40 rounded-full" />
              <div className="w-2.5 h-2.5 bg-emerald-500/40 rounded-full" />
              <span className="text-[9px] text-slate-600 pl-3">arafat-boucherie-dashboard.app</span>
            </div>

            {/* Dashboard Mockup Grid Layout */}
            <div className="grid grid-cols-3 gap-3 pt-3.5 h-full opacity-60">
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Chiffre d'Affaires</span>
                <span className="text-sm font-black text-white">415 500 FCFA</span>
                <span className="text-[8px] text-emerald-400 font-bold flex items-center">
                  <TrendingUp size={10} className="mr-0.5" /> +12.4%
                </span>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Solde Caisse</span>
                <span className="text-sm font-black text-emerald-450">289 000 FCFA</span>
                <span className="text-[8px] text-slate-500">Clôture en cours...</span>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 space-y-2">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold block">Alertes Stock</span>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[70%] rounded-full" />
                </div>
                <span className="text-[8px] text-slate-400 block font-light">3 articles à stock critique.</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT: Action Card (Login & Register Shortcuts) */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-sm bg-slate-900/60 border border-slate-850 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative"
          >
            {/* Header branding on card */}
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-xl font-extrabold text-white">Accès à l'application</h2>
              <p className="text-xs text-slate-500">Connectez-vous à votre espace ou enregistrez votre établissement.</p>
            </div>

            {/* CTAs */}
            <div className="space-y-4">
              <Link href="/login" className="block">
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <span>Se connecter</span>
                  <ChevronRight size={14} />
                </motion.button>
              </Link>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-4 text-[10px] text-slate-650 font-bold uppercase tracking-widest">ou</span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              <Link href="/register" className="block">
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <span>Créer un compte</span>
                  <ArrowUpRight size={14} className="opacity-60" />
                </motion.button>
              </Link>
            </div>

            {/* Footer notice */}
            <div className="mt-8 text-center text-[10px] text-slate-650 font-light leading-relaxed">
              Prêt pour l'usage commercial. Vos données locales sont sécurisées et chiffrées dans votre navigateur.
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

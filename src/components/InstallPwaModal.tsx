'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle2, Zap, ShieldCheck, Monitor, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPwaModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ne pas afficher si déjà installé (mode standalone)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // iOS n'est pas supporté (pas de beforeinstallprompt)
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return;

    const dismissed = sessionStorage.getItem('pwa_banner_dismissed');

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed) setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowBanner(false);
      setIsInstalling(false);
      setIsInstalledSuccess(true);
      setTimeout(() => setIsInstalledSuccess(false), 5000);
    };

    // Depuis la Sidebar : déclencher directement le prompt si disponible
    let latestPrompt: BeforeInstallPromptEvent | null = null;
    const handleTriggerInstall = () => {
      if (latestPrompt) triggerInstall(latestPrompt);
    };

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      latestPrompt = e as BeforeInstallPromptEvent;
      handleBeforeInstall(e);
    });
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open-pwa-install-guide', handleTriggerInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install-guide', handleTriggerInstall);
    };
  }, []);

  const triggerInstall = async (prompt: BeforeInstallPromptEvent) => {
    try {
      setIsInstalling(true);
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      } else {
        setIsInstalling(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Erreur installation PWA:', err);
      setIsInstalling(false);
    }
  };

  const handleInstallClick = () => {
    if (deferredPrompt) triggerInstall(deferredPrompt);
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    }
  };

  if (isStandalone) return null;

  // Déterminer le type d'appareil
  const ua = typeof window !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isAndroid = /android/i.test(ua);

  return (
    <>
      {/* Toast de succès */}
      <AnimatePresence>
        {isInstalledSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 font-bold text-xs"
          >
            <CheckCircle2 size={18} />
            <span>Application installée avec succès !</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bannière d'installation directe — Android & Desktop uniquement */}
      <AnimatePresence>
        {showBanner && deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[22rem] z-40"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 p-4 rounded-3xl shadow-2xl shadow-black/40">
              {/* En-tête */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src="/logo.png"
                      alt="DE Gestion"
                      className="w-12 h-12 rounded-2xl object-contain bg-slate-950 p-1 border border-slate-800 shadow-lg"
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                      {isAndroid ? <Smartphone size={10} className="text-slate-950" /> : <Monitor size={10} className="text-slate-950" />}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">DE Gestion</h4>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md">App</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      {isAndroid
                        ? "Accès rapide sur votre écran d'accueil Android"
                        : "Installez l'app sur votre ordinateur"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismissBanner}
                  className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                  title="Fermer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Avantages rapides */}
              <div className="flex items-center space-x-3 mb-3 px-1">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Zap size={11} className="text-emerald-400" />
                  <span>Hors-ligne</span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <ShieldCheck size={11} className="text-emerald-400" />
                  <span>Plein écran</span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Download size={11} className="text-emerald-400" />
                  <span>Sans store</span>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDismissBanner}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="flex-[2] py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-70 text-slate-950 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
                >
                  {isInstalling ? (
                    <>
                      <span className="w-3 h-3 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                      <span>Installation...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Installer l'App</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

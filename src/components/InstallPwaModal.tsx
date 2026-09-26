'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Share, 
  MoreVertical, 
  PlusSquare, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPwaModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios' | 'other'>('android');
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (typeof window !== 'undefined') {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      
      setIsStandalone(isStandaloneMode);

      // Detect OS
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setActiveGuideTab('ios');
      } else {
        setActiveGuideTab('android');
      }

      // Check if user dismissed banner previously this session
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed');

      // Listen for Android / Chrome beforeinstallprompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        if (!isStandaloneMode && !dismissed) {
          setShowBanner(true);
        }
      };

      const handleAppInstalled = () => {
        setDeferredPrompt(null);
        setShowBanner(false);
        setShowModal(false);
        setIsInstalledSuccess(true);
        setTimeout(() => setIsInstalledSuccess(false), 5000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', handleAppInstalled);

      // Listen for custom trigger event from Sidebar or other buttons
      const handleTriggerModal = () => {
        setShowModal(true);
      };
      window.addEventListener('open-pwa-install-guide', handleTriggerModal);

      // Show banner on mobile after 3 seconds if not in standalone mode
      if (!isStandaloneMode && !dismissed && /android|iphone|ipad|ipod|mobile/i.test(ua)) {
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 3000);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
          window.removeEventListener('appinstalled', handleAppInstalled);
          window.removeEventListener('open-pwa-install-guide', handleTriggerModal);
        };
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('open-pwa-install-guide', handleTriggerModal);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setShowBanner(false);
          setShowModal(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error during install prompt:', err);
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    }
  };

  if (isStandalone) {
    return null; // Already running as an installed PWA
  }

  return (
    <>
      {/* Toast de succès après installation */}
      <AnimatePresence>
        {isInstalledSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 font-bold text-xs"
          >
            <CheckCircle2 size={18} />
            <span>Application installée avec succès sur votre appareil !</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bannière flottante en bas de l'écran (particulièrement visible sur smartphone Android) */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 p-4 rounded-3xl shadow-2xl flex flex-col space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo.png" 
                  alt="Arafat Compta" 
                  className="w-12 h-12 rounded-2xl object-contain shadow-lg shadow-red-500/10 shrink-0 bg-slate-950 p-1 border border-slate-800" 
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Arafat Compta</h4>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md">Mobile App</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Installez l'application sur votre Android pour un accès rapide hors-ligne.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissBanner}
                className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={handleDismissBanner}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-350 text-[11px] font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                Plus tard
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-[1.5] py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-1.5"
              >
                <Download size={14} />
                <span>Installer l'App</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Modal Interactif d'installation sur Android & Mobile */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 z-10 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <img 
                    src="/logo.png" 
                    alt="Arafat Compta" 
                    className="w-11 h-11 rounded-2xl object-contain shadow-md shrink-0 bg-slate-950 p-1 border border-slate-800" 
                  />
                  <div>
                    <h3 className="text-base font-black text-white">Installer Arafat Compta</h3>
                    <p className="text-xs text-slate-400">Transformez ce SaaS en application mobile sur votre téléphone</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Direct prompt button if available */}
              {deferredPrompt && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-white">Installation automatique prête</p>
                    <p className="text-[10px] text-emerald-400/80">Votre navigateur Android supporte l'installation directe en 1 clic.</p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 shrink-0 cursor-pointer flex items-center space-x-1.5"
                  >
                    <Download size={14} />
                    <span>Installer</span>
                  </button>
                </div>
              )}

              {/* Tabs for OS */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setActiveGuideTab('android')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
                    activeGuideTab === 'android'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-350'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>Android (Chrome / Samsung)</span>
                </button>
                <button
                  onClick={() => setActiveGuideTab('ios')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
                    activeGuideTab === 'ios'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-350'
                  }`}
                >
                  <Share size={14} />
                  <span>iPhone / iPad (Safari)</span>
                </button>
                <button
                  onClick={() => setActiveGuideTab('other')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
                    activeGuideTab === 'other'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-350'
                  }`}
                >
                  <ExternalLink size={14} />
                  <span>PC / Mac</span>
                </button>
              </div>

              {/* Instructions content */}
              <div className="text-xs text-slate-350 space-y-4">
                {activeGuideTab === 'android' && (
                  <div className="space-y-3">
                    <p className="text-slate-400 font-medium">
                      Sur Google Chrome ou Samsung Internet pour Android :
                    </p>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-start space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-850">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-xs">1</span>
                        <div>
                          <p className="font-bold text-white flex items-center">
                            Ouvrez le menu du navigateur <MoreVertical size={14} className="inline mx-1 text-slate-400" />
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Appuyez sur les <strong>3 petits points verticaux (⋮)</strong> situés tout en haut à droite de Google Chrome.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-850">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-xs">2</span>
                        <div>
                          <p className="font-bold text-white flex items-center">
                            Sélectionnez « Installer l'application » <Download size={14} className="inline mx-1 text-emerald-400" />
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Dans le menu déroulant, touchez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-850">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-xs">3</span>
                        <div>
                          <p className="font-bold text-white">Confirmez l'installation</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Validez sur la boîte de dialogue. L'icône <strong>Arafat Compta</strong> s'ajoutera immédiatement à vos applications Android, avec lancement plein écran et fluidité maximale !
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeGuideTab === 'ios' && (
                  <div className="space-y-3">
                    <p className="text-slate-400 font-medium">
                      Sur Apple Safari (iPhone / iPad) :
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-start space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-850">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-xs">1</span>
                        <div>
                          <p className="font-bold text-white flex items-center">
                            Touchez le bouton Partager <Share size={14} className="inline mx-1 text-sky-400" />
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Appuyez sur l'icône de partage (carré avec une flèche vers le haut) en bas de l'écran Safari.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-850">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-xs">2</span>
                        <div>
                          <p className="font-bold text-white flex items-center">
                            « Sur l'écran d'accueil » <PlusSquare size={14} className="inline mx-1 text-slate-300" />
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Faites défiler vers le bas et sélectionnez <strong>« Sur l'écran d'accueil »</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-850">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-xs">3</span>
                        <div>
                          <p className="font-bold text-white">Touchez « Ajouter »</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Appuyez sur <strong>Ajouter</strong> en haut à droite. L'application apparaîtra sur votre écran d'accueil iOS.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeGuideTab === 'other' && (
                  <div className="space-y-3">
                    <p className="text-slate-400 font-medium">
                      Sur ordinateur (Google Chrome / Microsoft Edge) :
                    </p>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 space-y-2">
                      <p className="font-bold text-white">Dans la barre d'adresse du navigateur :</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Cliquez sur l'icône d'ordinateur avec une flèche <strong>« Installer Arafat Compta »</strong> située à l'extrémité droite de la barre d'adresse URL, puis cliquez sur <strong>Installer</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Benefits badge */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-850">
                <div className="flex items-center space-x-1.5">
                  <Zap size={13} className="text-emerald-400 shrink-0" />
                  <span>Démarrage instantané</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                  <span>Plein écran sans barre URL</span>
                </div>
              </div>

              {/* Footer action */}
              <div className="pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                >
                  J'ai compris
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

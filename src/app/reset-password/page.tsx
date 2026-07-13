'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LocalDbStore } from '@/lib/db/store';
import { motion } from 'framer-motion';
import { 
  Boxes, 
  Mail, 
  Lock, 
  ArrowLeft, 
  CheckCircle, 
  Info,
  ShieldCheck
} from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();

  // Reset Wizard steps: 'email' | 'password' | 'success'
  const [step, setStep] = useState<'email' | 'password' | 'success'>('email');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Target account info
  const [targetAccountId, setTargetAccountId] = useState('');

  // UI states
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    try {
      const accounts = LocalDbStore.getAccounts();
      const account = accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());

      if (!account) {
        throw new Error("Cette adresse e-mail ne correspond à aucun compte enregistré.");
      }

      setTargetAccountId(account.id);
      
      // Simulate sending link
      setInfoMsg("Un lien de réinitialisation a été généré pour la démo. Cliquez sur 'Continuer la démo' pour définir le nouveau mot de passe.");
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères.');
      setLoading(false);
      return;
    }

    try {
      LocalDbStore.resetAccountPassword(targetAccountId, password, 'Utilisateur');
      setStep('success');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden select-none">
      {/* Ambient blob */}
      <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800 backdrop-blur-md shadow-2xl relative"
      >
        {/* Back Link */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-850/60">
          <Link href="/login" className="text-slate-500 hover:text-white flex items-center text-xs space-x-1.5 transition-colors">
            <ArrowLeft size={14} />
            <span>Retour connexion</span>
          </Link>
          <div className="flex items-center space-x-1">
            <Boxes size={16} className="text-emerald-400" />
            <span className="text-[10px] font-extrabold text-slate-300 tracking-wider">ARAFAT COMPTA</span>
          </div>
        </div>

        {/* STEP 1: ENTER EMAIL */}
        {step === 'email' && (
          <>
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black text-white">Réinitialisation</h2>
              <p className="text-xs text-slate-500">Saisissez votre e-mail pour recevoir le lien de réinitialisation.</p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-200 text-xs flex items-center space-x-2">
                <Info size={16} className="text-rose-455 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Votre Adresse Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nom@boucherie.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-655 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Recherche...' : "Envoyer le lien"}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: SET PASSWORD */}
        {step === 'password' && (
          <>
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black text-white">Nouveau Mot de passe</h2>
              <p className="text-xs text-slate-500">Définissez votre nouveau mot de passe de connexion.</p>
            </div>

            {infoMsg && (
              <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 text-xs flex items-center space-x-2">
                <Info size={16} className="text-emerald-400 flex-shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-200 text-xs flex items-center space-x-2">
                <Info size={16} className="text-rose-455 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-655 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Confirmer le mot de passe</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-655 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {loading ? 'Mise à jour...' : "Confirmer le nouveau mot de passe"}
              </button>
            </form>
          </>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="text-center space-y-6 py-4 animate-scaleUp">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">Mot de passe réinitialisé !</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Votre nouveau mot de passe a été enregistré. Redirection vers la page de connexion...
              </p>
            </div>

            <div className="pt-2">
              <Link href="/login" className="block w-full">
                <button className="w-full py-3 bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
                  Se connecter immédiatement
                </button>
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

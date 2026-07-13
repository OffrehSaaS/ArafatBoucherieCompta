'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Boxes, 
  Lock, 
  Mail, 
  ShieldAlert, 
  ArrowLeft,
  ArrowRight,
  Info 
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState('');

  useEffect(() => {
    // Show success message if redirected from registration
    const registered = searchParams.get('registered');
    const registeredEmail = searchParams.get('email');
    if (registered === 'true') {
      setSuccessInfo('Votre compte Administrateur a été créé avec succès ! Connectez-vous.');
      if (registeredEmail) {
        setEmail(registeredEmail);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessInfo('');
    setLoading(true);

    try {
      if (!email || !email.includes('@')) {
        throw new Error('Veuillez entrer une adresse email valide.');
      }
      if (!password) {
        throw new Error('Veuillez entrer votre mot de passe.');
      }

      const res = await login(email, password);
      if (!res.success) {
        setError(res.message || 'Identifiants incorrects.');
      } else {
        // If Remember Me is checked, save in localStorage
        if (rememberMe) {
          window.localStorage.setItem('boucherie_remember_email', email);
        } else {
          window.localStorage.removeItem('boucherie_remember_email');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fill saved email
    const savedEmail = window.localStorage.getItem('boucherie_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden select-none">
      {/* Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6 bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800 backdrop-blur-md shadow-2xl relative"
      >
        {/* Back Link */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-850/60">
          <Link href="/" className="text-slate-500 hover:text-white flex items-center text-xs space-x-1.5 transition-colors">
            <ArrowLeft size={14} />
            <span>Accueil</span>
          </Link>
          <div className="flex items-center space-x-1">
            <Boxes size={16} className="text-emerald-400" />
            <span className="text-[10px] font-extrabold text-slate-300 tracking-wider">ARAFAT COMPTA</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Connexion
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            Saisissez vos identifiants pour accéder à votre espace.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-2xl flex items-center space-x-3 text-rose-200 text-xs"
          >
            <ShieldAlert className="h-5 w-5 text-rose-455 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {successInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 bg-emerald-950/40 border border-emerald-900/60 rounded-2xl flex items-center space-x-3 text-emerald-250 text-xs"
          >
            <Info className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>{successInfo}</span>
          </motion.div>
        )}

        {/* Credentials Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">
              Adresse Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail size={16} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@boucherie.com"
                className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-655 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Mot de passe
              </label>
              <Link href="/reset-password" className="text-[10px] text-emerald-450 hover:text-emerald-400 font-bold transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock size={16} />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-655 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 bg-slate-950 border-slate-800 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-400 cursor-pointer">
              Se souvenir de moi
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-1.5 py-3 px-4 text-xs font-bold rounded-xl text-slate-950 bg-emerald-500 hover:bg-emerald-450 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <span>Se Connecter</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>

        {/* Signup redirection link */}
        <div className="text-center text-xs text-slate-500">
          Nouveau sur Arafat Compta ?{' '}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-350 font-bold transition-colors">
            Créer un compte
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

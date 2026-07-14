'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LocalDbStore } from '@/lib/db/store';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { 
  Boxes, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  UserCheck, 
  ArrowLeft,
  Info,
  Clock
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  // Role is strictly vendor for public signups
  const role = 'vendeur';

  // Input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredPending, setRegisteredPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field checks
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email,
        fullName,
        phone,
        role: role as 'vendeur',
        password,
        status: 'pending' as const
      };

      if (isSupabaseConfigured() && supabase) {
        // Sign up with Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: 'vendeur',
              status: 'pending'
            }
          }
        });
        
        if (signUpError) {
          throw new Error(signUpError.message);
        }

        if (signUpData.user) {
          // Upsert the profile in profiles table (to avoid trigger key conflict)
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: signUpData.user.id,
              email,
              role: 'vendeur',
              full_name: fullName,
              phone: phone,
              status: 'pending'
            });
            
          if (profileError) {
            throw new Error(profileError.message);
          }
        }
      } else {
        // Local fallback
        await LocalDbStore.registerAccount(payload);
      }

      setRegisteredPending(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte. L'adresse email est peut-être déjà prise.");
    } finally {
      setLoading(false);
    }
  };

  if (registeredPending) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 select-none relative">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900 border border-slate-850 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative z-10"
        >
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Clock size={32} className="animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">Inscription enregistrée</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Votre demande d'inscription en tant que <strong>Vendeur</strong> a été envoyée.
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl text-left space-y-2.5 text-xs text-slate-350 leading-relaxed font-light">
            <p>💡 <strong>Note importante :</strong></p>
            <p>Votre compte est actuellement **en attente de validation** par l'administrateur principal du commerce.</p>
            <p>Vous ne pourrez accéder à votre tableau de bord vendeur qu'une fois que celui-ci aura approuvé votre fiche d'accès.</p>
          </div>

          <Link href="/" className="block">
            <button className="w-full py-3 bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
              Retour à l'accueil
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 select-none relative">
      {/* Glow */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Back Link */}
        <div className="pb-4 mb-4 border-b border-slate-850/60 flex items-center justify-between">
          <Link href="/" className="text-slate-500 hover:text-white flex items-center text-xs space-x-1.5 transition-colors">
            <ArrowLeft size={14} />
            <span>Retour</span>
          </Link>
          <div className="flex items-center space-x-1">
            <Boxes size={16} className="text-emerald-400" />
            <span className="text-[10px] font-extrabold text-slate-300 tracking-wider">ARAFAT COMPTA</span>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1.5 mb-6 text-center">
          <h2 className="text-2xl font-black text-white leading-none flex items-center justify-center">
            <UserCheck className="text-emerald-450 mr-2 h-6 w-6 shrink-0" />
            Créer un compte Vendeur
          </h2>
          <p className="text-xs text-slate-500">Inscrivez-vous pour rejoindre l'équipe de vente du commerce.</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-rose-200 text-xs flex items-center space-x-2">
            <Info size={16} className="text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nom complet</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User size={14} />
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ex: Fatoumata Barry"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-655 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Address */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Adresse e-mail</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ex: vendeur@arafat.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-655 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Numéro de téléphone</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Phone size={14} />
                </span>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ex: +226 73 11 22 33"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-655 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mot de passe</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={14} />
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

            {/* Confirm Password */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Confirmer mot de passe</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={14} />
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
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Création en cours...' : "S'inscrire en tant que Vendeur"}
            </button>
          </div>
        </form>

        {/* Footer link to login */}
        <div className="mt-6 text-center text-xs text-slate-450 font-light">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-350 font-bold">
            Se connecter
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

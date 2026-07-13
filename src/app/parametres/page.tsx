'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  Settings, 
  Lock, 
  Sparkles, 
  Info,
  Trash2,
  CheckCircle,
  Building,
  Target,
  Phone,
  MapPin,
  RefreshCw,
  User,
  Mail,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

export default function ParametresPage() {
  const { user, updateProfile } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Profile States
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // General Config States
  const [butcheryName, setButcheryName] = useState('Boucherie Arafat');
  const [dailyGoal, setDailyGoal] = useState<number>(250000);
  const [phone, setPhone] = useState('+226 70 00 11 22');
  const [address, setAddress] = useState('Ouagadougou, Burkina Faso');
  const [logo, setLogo] = useState<string>('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Dialog States
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isSaveProfileOpen, setIsSaveProfileOpen] = useState(false);
  const [isSaveCompanyOpen, setIsSaveCompanyOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setAvatar(user.avatar || '');
    }

    if (typeof window !== 'undefined') {
      const savedName = window.localStorage.getItem('boucherie_name');
      const savedGoal = window.localStorage.getItem('boucherie_goal');
      const savedPhone = window.localStorage.getItem('boucherie_phone');
      const savedAddr = window.localStorage.getItem('boucherie_address');
      const savedLogo = window.localStorage.getItem('boucherie_logo');
      
      if (savedName) setButcheryName(savedName);
      if (savedGoal) setDailyGoal(Number(savedGoal));
      if (savedPhone) setPhone(savedPhone);
      if (savedAddr) setAddress(savedAddr);
      if (savedLogo) setLogo(savedLogo);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password && password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsSaveProfileOpen(true);
  };

  const handleConfirmSaveProfile = async () => {
    setIsSaveProfileOpen(false);
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await updateProfile(fullName, email, avatar || undefined, password || undefined);
      if (res.success) {
        setSuccessMsg('Votre profil a été mis à jour avec succès !');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.message || 'Une erreur est survenue.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaveCompanyOpen(true);
  };

  const handleConfirmSaveCompany = () => {
    setIsSaveCompanyOpen(false);
    setLoading(true);
    setSuccessMsg('');

    try {
      window.localStorage.setItem('boucherie_name', butcheryName);
      window.localStorage.setItem('boucherie_goal', dailyGoal.toString());
      window.localStorage.setItem('boucherie_phone', phone);
      window.localStorage.setItem('boucherie_address', address);
      if (logo) {
        window.localStorage.setItem('boucherie_logo', logo);
      } else {
        window.localStorage.removeItem('boucherie_logo');
      }

      setSuccessMsg('Paramètres généraux de la boucherie mis à jour ! Rechargement...');
      setTimeout(() => {
        setSuccessMsg('');
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = () => {
    setIsResetDialogOpen(false);
    setLoading(true);
    try {
      const keysToClear = [
        'boucherie_products',
        'boucherie_suppliers',
        'boucherie_stock_history',
        'boucherie_outputs',
        'boucherie_sales',
        'boucherie_expenses',
        'boucherie_debts',
        'boucherie_debt_payments',
        'boucherie_employees',
        'boucherie_salaries',
        'boucherie_cash_registries',
        'boucherie_activity_logs',
        'boucherie_categories',
        'boucherie_logo'
      ];
      keysToClear.forEach(k => window.localStorage.removeItem(k));

      setSuccessMsg('Données réinitialisées avec succès ! Rechargement...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
          <Settings className="text-slate-400 mr-2 h-8 w-8" />
          Paramètres
        </h1>
        <p className="text-slate-400 mt-1">Gérez vos informations de profil et configurez l'établissement.</p>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-2xl flex items-center space-x-3 text-emerald-200 text-sm"
        >
          <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl flex items-center space-x-3 text-rose-200 text-sm"
        >
          <Info className="h-5 w-5 text-rose-455 flex-shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card Section */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-6">
          <div>
            <h3 className="text-md font-bold text-white flex items-center">
              <User className="text-emerald-400 mr-2 h-5 w-5" />
              Mon Profil
            </h3>
            <p className="text-xs text-slate-500 mt-1">Mettez à jour vos coordonnées personnelles et votre mot de passe.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                {avatar ? (
                  <img src={avatar} className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500 shadow" alt="Profile" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-slate-400 font-black text-2xl shadow">
                    {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-1 bg-emerald-500 rounded-full cursor-pointer text-slate-950 hover:bg-emerald-400 shadow transition-colors">
                  <Camera size={12} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Photo de profil</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Fichiers recommandés : PNG, JPG</span>
              </div>
            </div>

            {/* Nom complet */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nom complet</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Adresse Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Laisser vide pour inchangé"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Confirmer mot de passe</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Laisser vide pour inchangé"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer text-xs disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer mon Profil'}
              </button>
            </div>
          </form>
        </div>

        {/* Company Settings Card Section (Admin Only) */}
        {isAdmin && (
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-6">
            <div>
              <h3 className="text-md font-bold text-white flex items-center">
                <Building className="text-emerald-400 mr-2 h-5 w-5" />
                Coordonnées de l'Établissement
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configurez le nom, l'adresse, l'objectif financier et le logo du commerce.</p>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4">
              {/* Logo Upload */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {logo ? (
                    <img src={logo} className="h-16 w-16 object-contain bg-slate-950 border-2 border-emerald-500 p-1 rounded-2xl shadow" alt="Logo" />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-slate-400 shadow">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 p-1 bg-emerald-500 rounded-full cursor-pointer text-slate-950 hover:bg-emerald-400 shadow transition-colors">
                    <Camera size={12} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Logo Commercial</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">S'affichera dans le dashboard et la sidebar.</span>
                </div>
              </div>

              {/* Nom du commerce */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nom du commerce</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Building size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={butcheryName}
                    onChange={e => setButcheryName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Objectif journalier */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Objectif de CA journalier (FCFA)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Target size={16} />
                  </span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={dailyGoal || ''}
                    onChange={e => setDailyGoal(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Téléphone */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Téléphone</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Phone size={16} />
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Adresse</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <MapPin size={16} />
                    </span>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer text-xs disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer Boucherie'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Danger Zone (Admin only) */}
      {isAdmin && (
        <div className="bg-slate-900 border border-rose-950/40 p-6 rounded-3xl space-y-4">
          <div>
            <h3 className="text-md font-bold text-rose-455 flex items-center">
              <Trash2 className="mr-2 h-5 w-5" />
              Zone de Danger
            </h3>
            <p className="text-xs text-slate-500 mt-1">Actions critiques affectant l'ensemble de la base de données locale.</p>
          </div>

          <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl text-xs space-y-1">
            <h4 className="font-bold text-rose-350">Réinitialisation Complète des Données</h4>
            <p className="text-slate-400 font-light leading-relaxed">
              Supprime tous les enregistrements locaux (historiques, fiches de paie, stocks, ventes, dépenses) et rétablit les paramètres d'usine.
            </p>
          </div>

          <button
            onClick={() => setIsResetDialogOpen(true)}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-rose-900 hover:bg-rose-800 text-rose-200 hover:text-white rounded-xl text-xs font-bold border border-rose-850 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Réinitialiser la Base de Données</span>
          </button>
        </div>
      )}

      {/* Profile Save Confirmation */}
      <ConfirmDialog
        isOpen={isSaveProfileOpen}
        title="Mise à jour du profil"
        message="Voulez-vous enregistrer vos modifications de profil ? Les changements seront appliqués immédiatement."
        type="confirm"
        confirmText="Enregistrer"
        cancelText="Annuler"
        onConfirm={handleConfirmSaveProfile}
        onCancel={() => setIsSaveProfileOpen(false)}
      />

      {/* Company Settings Save Confirmation */}
      <ConfirmDialog
        isOpen={isSaveCompanyOpen}
        title="Sauvegarder les coordonnées"
        message="Enregistrer les paramètres de l'établissement ? L'application se rechargera pour synchroniser l'affichage."
        type="confirm"
        confirmText="Enregistrer"
        cancelText="Annuler"
        onConfirm={handleConfirmSaveCompany}
        onCancel={() => setIsSaveCompanyOpen(false)}
      />

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="⚠️ Réinitialisation Générale"
        message="Voulez-vous supprimer toutes les modifications locales et rétablir les données d'exemples ? Cette action effacera également le logo enregistré."
        type="danger"
        confirmText="Réinitialiser"
        cancelText="Conserver"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
}

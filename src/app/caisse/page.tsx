'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, CashRegistry, Product, Debt, Expense } from '@/lib/db/store';
import { formatFCFA, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Plus, 
  Edit3, 
  Search, 
  X,
  Sparkles,
  Info,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  HelpCircle
} from 'lucide-react';

export default function CaissePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [registries, setRegistries] = useState<CashRegistry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Search/Filters State
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState('');
  const [startingCash, setStartingCash] = useState<number>(0);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Recalculate today's caisse on page load to ensure accuracy
    LocalDbStore.recalculateCaisseForToday();
    setRegistries(LocalDbStore.getCashRegistries().sort((a,b) => b.date.localeCompare(a.date)));
    setProducts(LocalDbStore.getProducts());
    setDebts(LocalDbStore.getDebts());
    setExpenses(LocalDbStore.getExpenses());
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenEditModal = (reg: CashRegistry) => {
    if (!isAdmin) return;
    setDate(reg.date);
    setStartingCash(reg.startingCash);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (startingCash < 0) {
      setError('La caisse de départ ne peut pas être négative.');
      return;
    }

    try {
      LocalDbStore.updateStartingCash(date, startingCash, user?.fullName || 'Utilisateur');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  // Filter registries
  const filteredRegistries = registries.filter(r => 
    r.date.includes(searchTerm)
  );

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <Wallet className="text-emerald-450 mr-2 h-8 w-8" />
            Tiroir Caisse & Journaux
          </h1>
          <p className="text-slate-400 mt-1">Suivez les états de clôture de caisse quotidiens et les soldes physiques.</p>
        </div>
      </div>

      {/* Info Warning Card */}
      <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex items-start space-x-3">
        <Info className="text-emerald-450 h-5 w-5 mt-0.5 shrink-0" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-200">Fonctionnement du Tiroir Caisse</p>
          <p className="text-slate-400 font-light leading-relaxed">
            La formule de clôture est calculée automatiquement : 
            **Caisse Finale = Caisse de Départ + Ventes Totales - Dépenses Totales - Salaires Payés**. 
            {isAdmin 
              ? " En tant qu'Administrateur, vous êtes autorisé à modifier la caisse de départ pour corriger le fond de caisse initial."
              : " Les vendeurs ont un accès en consultation uniquement. Contactez l'administrateur pour toute rectification du fond de caisse de départ."
            }
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher par date (Ex: YYYY-MM-DD)..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Grid List for Cash Registries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRegistries.map(reg => {
          const isToday = reg.date === new Date().toISOString().split('T')[0];
          
          // Calculations for additional metrics
          const regExpensesRaw = expenses.filter(e => e.createdAt.startsWith(reg.date));
          const lossesTotal = regExpensesRaw.filter(e => e.category === 'Pertes').reduce((acc, e) => acc + e.amount, 0);
          const totalStockVal = products.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);
          const totalRemainingDebts = debts.reduce((acc, d) => acc + d.remainingAmount, 0);

          return (
            <div 
              key={reg.id} 
              className={`bg-slate-900 border p-5 rounded-3xl flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 group relative ${
                isToday ? 'border-emerald-500/40 bg-gradient-to-br from-slate-900 to-emerald-950/10' : 'border-slate-850'
              }`}
            >
              {isToday && (
                <span className="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">
                  Aujourd'hui
                </span>
              )}

              <div className="space-y-4">
                {/* Header */}
                <div>
                  <h4 className="font-extrabold text-white text-md group-hover:text-emerald-450 transition-colors">
                    Clôture du {formatDate(reg.date)}
                  </h4>
                  <p className="text-[10px] text-slate-500">Généré le {new Date(reg.createdAt).toLocaleDateString()}</p>
                  
                  {/* Calculations Row */}
                  <div className="grid grid-cols-2 gap-3 text-xs mt-4">
                    {/* Depart */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Caisse de Départ</p>
                      <p className="text-white font-extrabold mt-1">{formatFCFA(reg.startingCash)}</p>
                    </div>
                    {/* Ventes */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Ventes (+)</p>
                        <p className="text-emerald-400 font-extrabold mt-1">+{formatFCFA(reg.salesTotal)}</p>
                      </div>
                      <PlusCircle size={16} className="text-emerald-500/30" />
                    </div>
                    {/* Stock au Frigo */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Stock au Frigo (+)</p>
                        <p className="text-emerald-400 font-extrabold mt-1">+{formatFCFA(totalStockVal)}</p>
                      </div>
                      <PlusCircle size={16} className="text-emerald-500/30" />
                    </div>
                    {/* Dépenses */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Dépenses (-)</p>
                        <p className="text-rose-455 font-extrabold mt-1">-{formatFCFA(reg.expensesTotal)}</p>
                      </div>
                      <MinusCircle size={16} className="text-rose-500/30" />
                    </div>
                    {/* Salaires */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Salaires (-)</p>
                        <p className="text-rose-455 font-extrabold mt-1">-{formatFCFA(reg.salariesTotal)}</p>
                      </div>
                      <MinusCircle size={16} className="text-rose-500/30" />
                    </div>
                    {/* Dettes Fournisseurs */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Dettes Fourn. (-)</p>
                        <p className="text-rose-455 font-extrabold mt-1">-{formatFCFA(totalRemainingDebts)}</p>
                      </div>
                      <MinusCircle size={16} className="text-rose-500/30" />
                    </div>
                    {/* Pertes */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between col-span-2">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Pertes (-)</p>
                        <p className="text-rose-455 font-extrabold mt-1">-{formatFCFA(lossesTotal)}</p>
                      </div>
                      <MinusCircle size={16} className="text-rose-500/30" />
                    </div>
                  </div>
                </div>

                {/* Final Caisse */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Solde Final de Caisse</span>
                    <span className="text-lg font-black text-emerald-450 mt-1 block">{formatFCFA(reg.endingCash)}</span>
                  </div>
                  <ArrowRight size={22} className="text-emerald-500/30" />
                </div>
              </div>

              {/* Actions Footer (Admin only) */}
              {isAdmin && (
                <div className="flex items-center justify-end border-t border-slate-850 mt-4 pt-3">
                  <button
                    onClick={() => handleOpenEditModal(reg)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-emerald-400 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Modifier Caisse de Départ</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Starting Cash Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                <h3 className="text-lg font-extrabold text-white flex items-center">
                  <Sparkles className="text-emerald-400 mr-2 h-5 w-5" />
                  Modifier Caisse de Départ
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-455 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="my-4 p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-200 text-xs flex items-center space-x-2">
                  <Info size={16} className="text-rose-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSave} className="space-y-4 mt-4">
                {/* Date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date concernée</label>
                  <input
                    type="date"
                    disabled
                    value={date}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Starting Cash */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fond de Caisse Initial (FCFA)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={startingCash === 0 ? '0' : (startingCash || '')}
                    onChange={e => setStartingCash(Number(e.target.value))}
                    placeholder="Ex: 150000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 py-3 bg-slate-850 hover:bg-slate-800 text-slate-450 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, CashRegistry, Product, Debt, Expense, UserAccount } from '@/lib/db/store';
import { formatFCFA, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  Wallet, 
  Edit3, 
  Trash2,
  Search, 
  X,
  Sparkles,
  Info,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  Users,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Calendar,
  Layers,
  AlertTriangle
} from 'lucide-react';

export default function CaissePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [registries, setRegistries] = useState<CashRegistry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);

  // Active date for attribution / viewing
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Tab State for Admin: 'vendors' | 'synthese'
  const [adminTab, setAdminTab] = useState<'vendors' | 'synthese'>('vendors');

  // Search/Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('ALL');

  // Attribution form amounts state (vendorName -> amount)
  const [attributionAmounts, setAttributionAmounts] = useState<Record<string, number>>({});
  const [attributionSuccess, setAttributionSuccess] = useState<string | null>(null);

  // Modal State for editing existing registry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegistry, setEditingRegistry] = useState<CashRegistry | null>(null);
  const [modalDate, setModalDate] = useState('');
  const [modalStartingCash, setModalStartingCash] = useState<number>(0);
  const [modalVendorName, setModalVendorName] = useState<string>('');
  const [error, setError] = useState('');

  // Delete State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [caisseToDeleteId, setCaisseToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    LocalDbStore.recalculateCaisseForToday();
    const allRegs = LocalDbStore.getCashRegistries().sort((a,b) => b.date.localeCompare(a.date));
    setRegistries(allRegs);
    setProducts(LocalDbStore.getProducts());
    setDebts(LocalDbStore.getDebts());
    setExpenses(LocalDbStore.getExpenses());
    const allAccounts = LocalDbStore.getAccounts();
    setAccounts(allAccounts);

    // Seed attribution inputs with existing amounts for today
    const initialAmounts: Record<string, number> = {};
    allRegs.filter(r => r.date === todayStr && r.vendorName && r.vendorName !== 'Générale').forEach(r => {
      if (r.vendorName) {
        initialAmounts[r.vendorName] = r.startingCash;
      }
    });
    setAttributionAmounts(prev => ({ ...initialAmounts, ...prev }));
  };

  // List of active vendors (from user accounts + active employees/sellers)
  const vendorsList = React.useMemo(() => {
    const list: { id: string; name: string; phone?: string }[] = [];
    const seen = new Set<string>();

    accounts.filter(a => a.role === 'vendeur').forEach(acc => {
      if (!seen.has(acc.fullName)) {
        seen.add(acc.fullName);
        list.push({ id: acc.id, name: acc.fullName, phone: acc.phone });
      }
    });

    // Also include any vendor present in cash registries
    registries.filter(r => r.vendorName && r.vendorName !== 'Générale').forEach(r => {
      if (!seen.has(r.vendorName!)) {
        seen.add(r.vendorName!);
        list.push({ id: r.vendorName!, name: r.vendorName! });
      }
    });

    if (list.length === 0) {
      list.push({ id: 'Fatoumata Barry', name: 'Fatoumata Barry' });
    }

    return list;
  }, [accounts, registries]);

  // Handler for Admin starting cash attribution
  const handleAssignStartingCash = (vendorName: string) => {
    const amount = Number(attributionAmounts[vendorName] || 0);
    if (amount < 0) {
      alert('Le montant ne peut pas être négatif.');
      return;
    }

    try {
      LocalDbStore.assignVendorStartingCash(selectedDate, vendorName, amount, user?.fullName || 'Administrateur');
      setAttributionSuccess(`Fond de caisse de ${formatFCFA(amount)} attribué à ${vendorName} pour le ${formatDate(selectedDate)}.`);
      setTimeout(() => setAttributionSuccess(null), 5000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue.');
    }
  };

  const handleOpenEditModal = (reg: CashRegistry) => {
    if (!isAdmin) return;
    setEditingRegistry(reg);
    setModalDate(reg.date);
    setModalVendorName(reg.vendorName || 'Générale');
    setModalStartingCash(reg.startingCash);
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (modalStartingCash < 0) {
      setError('La caisse de départ ne peut pas être négative.');
      return;
    }

    try {
      if (modalVendorName && modalVendorName !== 'Générale') {
        LocalDbStore.assignVendorStartingCash(modalDate, modalVendorName, modalStartingCash, user?.fullName || 'Administrateur');
      } else {
        LocalDbStore.updateStartingCash(modalDate, modalStartingCash, user?.fullName || 'Administrateur');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  const handleDeleteCaisse = (id: string) => {
    setCaisseToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDeleteCaisse = () => {
    if (caisseToDeleteId) {
      try {
        LocalDbStore.deleteCashRegistry(caisseToDeleteId, user?.fullName || 'Utilisateur');
        setIsConfirmOpen(false);
        setCaisseToDeleteId(null);
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Filtered registries for display
  const displayedRegistries = registries.filter(r => {
    // Non-admin vendors only see their own cash registers
    if (!isAdmin) {
      return r.vendorName === user?.fullName;
    }

    // Admin view
    if (adminTab === 'synthese') {
      return r.vendorName === 'Générale' || !r.vendorName;
    }

    // Vendor caisses tab
    const matchesVendor = selectedVendorFilter === 'ALL' || r.vendorName === selectedVendorFilter;
    const isVendorReg = r.vendorName && r.vendorName !== 'Générale';
    const matchesDate = !searchTerm || r.date.includes(searchTerm) || (r.vendorName && r.vendorName.toLowerCase().includes(searchTerm.toLowerCase()));
    return isVendorReg && matchesVendor && matchesDate;
  });

  // Current vendor's personal register for today (or selected date)
  const currentVendorReg = registries.find(r => r.date === selectedDate && r.vendorName === user?.fullName);

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <Wallet className="text-emerald-450 mr-2 h-8 w-8" />
            {isAdmin ? 'Tiroir Caisse & Attribution Quotidienne' : 'Mon Tiroir Caisse'}
          </h1>
          <p className="text-slate-400 mt-1">
            {isAdmin 
              ? 'Attribuez le fond de caisse quotidien en espèces à chaque vendeur et suivez les clôtures.' 
              : 'Consultez votre fond de caisse personnel confié le matin, vos encaissements et votre solde disponible.'}
          </p>
        </div>

        {/* Global Date selector */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-inner">
          <Calendar size={16} className="text-emerald-450" />
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date :</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* ADMIN SECTION: DAILY STARTING CASH ATTRIBUTION PER VENDOR */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border border-emerald-500/30 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <Coins size={22} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center">
                  Attribution Quotidienne du Fond de Caisse (Espèces)
                </h3>
                <p className="text-xs text-slate-400">
                  Chaque jour est unique : confiez un nouveau montant en espèces à chaque vendeur pour démarrer sa journée.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-full self-start sm:self-center">
              Date : {formatDate(selectedDate)}
            </span>
          </div>

          {attributionSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center space-x-2"
            >
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span className="font-semibold">{attributionSuccess}</span>
            </motion.div>
          )}

          {/* Vendors Attribution Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vendorsList.map(vendor => {
              const vendorReg = registries.find(r => r.date === selectedDate && r.vendorName === vendor.name);
              const isAssigned = vendorReg && vendorReg.startingCash > 0;
              const currentInput = attributionAmounts[vendor.name] !== undefined 
                ? attributionAmounts[vendor.name] 
                : (vendorReg?.startingCash || 0);

              return (
                <div 
                  key={vendor.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    isAssigned 
                      ? 'bg-slate-950/70 border-emerald-500/40' 
                      : 'bg-slate-950/40 border-amber-500/30'
                  } space-y-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-white text-sm">
                        {vendor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{vendor.name}</h4>
                        <p className="text-[10px] text-slate-400">Vendeur assigné</p>
                      </div>
                    </div>
                    {isAssigned ? (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold rounded-lg uppercase tracking-wider flex items-center">
                        <CheckCircle2 size={12} className="mr-1" /> Fond : {formatFCFA(vendorReg.startingCash)}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold rounded-lg uppercase tracking-wider flex items-center">
                        <AlertTriangle size={12} className="mr-1" /> En attente de remise
                      </span>
                    )}
                  </div>

                  {/* Summary of current state */}
                  {vendorReg && (
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl text-center border border-slate-850">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-slate-500">Ventes (+)</p>
                        <p className="text-xs font-black text-emerald-400">{formatFCFA(vendorReg.salesTotal)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-slate-500">Dépenses (-)</p>
                        <p className="text-xs font-black text-rose-450">{formatFCFA(vendorReg.expensesTotal)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-slate-500">Tiroir Actuel</p>
                        <p className="text-xs font-black text-white">{formatFCFA(vendorReg.endingCash)}</p>
                      </div>
                    </div>
                  )}

                  {/* Allocation Input & Presets */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                      <span>Montant en espèces confié (FCFA) :</span>
                      {isAssigned && <span className="text-emerald-450 lowercase">déjà attribué</span>}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={currentInput === 0 ? '' : currentInput}
                        placeholder="Ex: 50000"
                        onChange={e => {
                          const val = Number(e.target.value);
                          setAttributionAmounts(prev => ({ ...prev, [vendor.name]: val }));
                        }}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleAssignStartingCash(vendor.name)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        {isAssigned ? 'Mettre à jour' : 'Confier Caisse'}
                      </button>
                    </div>

                    {/* Quick Amount Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[10000, 25000, 50000, 75000, 100000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAttributionAmounts(prev => ({ ...prev, [vendor.name]: amt }))}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-400 hover:text-white rounded-lg border border-slate-800 cursor-pointer transition-colors"
                        >
                          +{formatFCFA(amt)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* VENDOR SPECIFIC HERO VIEW (When non-admin) */}
      {!isAdmin && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Mon Espace Caisse Individuelle
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  Tiroir Caisse de {user?.fullName}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Situation pour la date du {formatDate(selectedDate)}
                </p>
              </div>

              {currentVendorReg && currentVendorReg.startingCash > 0 ? (
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-2">
                  <ShieldCheck className="text-emerald-400 h-5 w-5" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Statut Caisse</p>
                    <p className="text-xs font-black text-emerald-300">Fond Reçu de l'Admin</p>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center space-x-2">
                  <AlertTriangle className="text-amber-400 h-5 w-5" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Statut Caisse</p>
                    <p className="text-xs font-black text-amber-300">En attente de fond initial</p>
                  </div>
                </div>
              )}
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fond de Caisse Initial */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Caisse de Départ (Espèces)</p>
                <p className="text-2xl font-black text-white">
                  {formatFCFA(currentVendorReg?.startingCash || 0)}
                </p>
                <p className="text-[10px] text-slate-500">Confié par l'admin le matin</p>
              </div>

              {/* Mes Ventes */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Mes Ventes (+)</p>
                <p className="text-2xl font-black text-emerald-400">
                  +{formatFCFA(currentVendorReg?.salesTotal || 0)}
                </p>
                <p className="text-[10px] text-slate-500">Encaissements de la journée</p>
              </div>

              {/* Mes Dépenses */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Mes Dépenses (-)</p>
                <p className="text-2xl font-black text-rose-450">
                  -{formatFCFA(currentVendorReg?.expensesTotal || 0)}
                </p>
                <p className="text-[10px] text-slate-500">Sorties autorisées</p>
              </div>

              {/* Solde Actuel du Tiroir */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-1 bg-gradient-to-br from-slate-950 to-emerald-950/30">
                <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Espèces Disponibles</p>
                <p className="text-2xl font-black text-emerald-300">
                  {formatFCFA(currentVendorReg?.endingCash || 0)}
                </p>
                <p className="text-[10px] text-emerald-500/80 font-medium">Solde physique dans le tiroir</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start space-x-3 text-xs text-slate-400">
              <Info size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <p>
                Votre tiroir de caisse est strictement confidentiel et vous est attribué chaque jour personnellement par le vendeur administrateur. 
                À la clôture, remettez les espèces totales indiquées ci-dessus.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN TABS & FILTERS */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            {/* Tab switch */}
            <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setAdminTab('vendors')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  adminTab === 'vendors' 
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>Caisses Individuelles Vendeurs</span>
              </button>
              <button
                onClick={() => setAdminTab('synthese')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  adminTab === 'synthese' 
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers size={14} />
                <span>Synthèse Globale Boucherie</span>
              </button>
            </div>

            {/* Vendor Filter (when in vendors tab) */}
            {adminTab === 'vendors' && (
              <div className="flex items-center space-x-3">
                <select
                  value={selectedVendorFilter}
                  onChange={e => setSelectedVendorFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">Tous les vendeurs</option>
                  {vendorsList.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filtrer par date ou nom..."
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* REGISTRIES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedRegistries.map(reg => {
          const isToday = reg.date === todayStr;
          const isVendorRegistry = reg.vendorName && reg.vendorName !== 'Générale';

          // Calculations for global synthesis (Admin only)
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
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-white text-md group-hover:text-emerald-450 transition-colors">
                      {isVendorRegistry ? `Caisse de ${reg.vendorName}` : 'Clôture Générale de la Boucherie'}
                    </h4>
                    {isVendorRegistry && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                        Vendeur
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">Date : {formatDate(reg.date)}</p>
                  
                  {/* Calculations Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs mt-4">
                    {/* Caisse de Départ */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        {isVendorRegistry ? 'Fond de Départ Confié' : 'Total Fonds Initiaux'}
                      </p>
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

                    {/* Dépenses */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Dépenses (-)</p>
                        <p className="text-rose-455 font-extrabold mt-1">-{formatFCFA(reg.expensesTotal)}</p>
                      </div>
                      <MinusCircle size={16} className="text-rose-500/30" />
                    </div>

                    {/* For Admin General Synthesis only: Stock, Salaires, Dettes, Pertes */}
                    {!isVendorRegistry && isAdmin && (
                      <>
                        {/* Stock au Frigo */}
                        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                          <div>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Stock Frigo (+)</p>
                            <p className="text-emerald-400 font-extrabold mt-1">+{formatFCFA(totalStockVal)}</p>
                          </div>
                          <PlusCircle size={16} className="text-emerald-500/30" />
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
                        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                          <div>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Pertes (-)</p>
                            <p className="text-rose-455 font-extrabold mt-1">-{formatFCFA(lossesTotal)}</p>
                          </div>
                          <MinusCircle size={16} className="text-rose-500/30" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Final Caisse */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      {isVendorRegistry ? 'Solde Tiroir Vendeur' : 'Solde Global Net de Clôture'}
                    </span>
                    <span className="text-lg font-black text-emerald-450 mt-1 block">{formatFCFA(reg.endingCash)}</span>
                  </div>
                  <ArrowRight size={22} className="text-emerald-500/30" />
                </div>
              </div>

              {/* Actions Footer (Admin only) */}
              {isAdmin && (
                <div className="flex items-center justify-end space-x-2 border-t border-slate-850 mt-4 pt-3">
                  <button
                    onClick={() => handleOpenEditModal(reg)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-emerald-400 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Modifier Caisse de Départ</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCaisse(reg.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-955/20 hover:bg-rose-900/40 text-rose-455 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Supprimer</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayedRegistries.length === 0 && (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-850 rounded-3xl space-y-2">
          <Wallet size={36} className="mx-auto text-slate-600" />
          <p className="text-sm font-bold text-slate-400">Aucun enregistrement de caisse trouvé</p>
          <p className="text-xs text-slate-500">
            {isAdmin 
              ? "Utilisez le panneau ci-dessus pour attribuer le fond de caisse aux vendeurs pour la journée." 
              : "Votre fond de caisse sera visible dès que l'administrateur vous l'aura attribué."}
          </p>
        </div>
      )}

      {/* Edit Starting Cash Modal (Admin only) */}
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
              <form onSubmit={handleSaveModal} className="space-y-4 mt-4">
                {/* Vendor name (if specific) */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Caisse attribuée à</label>
                  <input
                    type="text"
                    disabled
                    value={modalVendorName}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-sm focus:outline-none"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date concernée</label>
                  <input
                    type="date"
                    disabled
                    value={modalDate}
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
                    value={modalStartingCash === 0 ? '0' : (modalStartingCash || '')}
                    onChange={e => setModalStartingCash(Number(e.target.value))}
                    placeholder="Ex: 50000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 font-bold"
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

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Supprimer la caisse"
        message="Voulez-vous vraiment supprimer cet enregistrement de caisse ? Cette action supprimera le fond initial de la journée sélectionnée."
        type="danger"
        confirmText="Supprimer la caisse"
        cancelText="Conserver"
        onConfirm={handleConfirmDeleteCaisse}
        onCancel={() => { setIsConfirmOpen(false); setCaisseToDeleteId(null); }}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Product, Sale, Expense, Output, Debt, Employee, CashRegistry, ActivityLog, UserAccount, StockRestant, Salary } from '@/lib/db/store';
import { formatFCFA } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import {
  TrendingUp,
  Wallet,
  Boxes,
  PiggyBank,
  ShoppingCart,
  Receipt,
  UserCheck,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Target,
  CircleDollarSign,
  ChevronRight,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // State for store data
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cashRegistries, setCashRegistries] = useState<CashRegistry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stockRestants, setStockRestants] = useState<StockRestant[]>([]);

  const [butcheryName, setButcheryName] = useState('Boucherie Arafat');
  const [dailyTarget, setDailyTarget] = useState<number>(250000);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [newRegistrationToast, setNewRegistrationToast] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    
    const loadLocal = () => {
      setProducts(LocalDbStore.getProducts());
      setSales(LocalDbStore.getSales());
      setExpenses(LocalDbStore.getExpenses());
      setOutputs(LocalDbStore.getOutputs());
      setDebts(LocalDbStore.getDebts());
      setEmployees(LocalDbStore.getEmployees());
      setCashRegistries(LocalDbStore.getCashRegistries());
      setActivityLogs(LocalDbStore.getActivityLogs());
      setAccounts(LocalDbStore.getAccounts());
      setSalaries(LocalDbStore.getSalaries());
      setStockRestants(LocalDbStore.getStockRestants());
    };

    loadLocal();

    if (typeof window !== 'undefined') {
      const name = window.localStorage.getItem('boucherie_name');
      const goal = window.localStorage.getItem('boucherie_goal');
      if (name) setButcheryName(name);
      if (goal) setDailyTarget(Number(goal));
    }

    // Sync from Supabase in the background and reload
    LocalDbStore.syncFromSupabase()
      .then(() => {
        loadLocal();
      })
      .catch(err => {
        console.error("Dashboard mount sync error:", err);
      });

    // Realtime subscription for admin notifications when accounts are registered
    let channel: any = null;
    if (isAdmin && isSupabaseConfigured() && supabase) {
      channel = supabase
        .channel('dashboard-profiles-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => {
            console.log('Realtime profile change in dashboard:', payload);
            LocalDbStore.syncFromSupabase()
              .then(() => {
                loadLocal();
                const newProfile = payload.new;
                setNewRegistrationToast(`Nouveau vendeur enregistré : ${newProfile.full_name || newProfile.email}`);
                // Auto-dismiss toast after 8 seconds
                setTimeout(() => {
                  setNewRegistrationToast(null);
                }, 8000);
              });
          }
        )
        .subscribe();
    }

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAdmin]);

  const handleApproveAccount = (accountId: string) => {
    try {
      LocalDbStore.updateAccountStatus(accountId, 'active', user?.fullName || 'Administrateur');
      setAccounts(LocalDbStore.getAccounts());
      setActivityLogs(LocalDbStore.getActivityLogs());
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectAccount = (accountId: string) => {
    try {
      LocalDbStore.updateAccountStatus(accountId, 'rejected', user?.fullName || 'Administrateur');
      setAccounts(LocalDbStore.getAccounts());
      setActivityLogs(LocalDbStore.getActivityLogs());
    } catch (err) {
      console.error(err);
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const filterDateStr = selectedDate || new Date().toISOString().split('T')[0];

  // Helper date conversions
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  };

  // --- KPI CALCULATIONS ---
  // Selected Date's Sales
  const todaySales = sales.filter(s => s.createdAt.startsWith(filterDateStr));
  const dailyCA = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const productsSoldToday = todaySales.reduce((acc, s) => acc + s.quantity, 0);

  // Selected Date's Expenses
  const todayExpensesRaw = expenses.filter(e => e.createdAt.startsWith(filterDateStr));
  const dailyExpenses = todayExpensesRaw.filter(e => e.category !== 'Salaires' && e.category !== 'Pertes').reduce((acc, e) => acc + e.amount, 0);
  const dailySalaries = todayExpensesRaw.filter(e => e.category === 'Salaires').reduce((acc, e) => acc + e.amount, 0);

  // Selected Date's Losses (Pertes déclarées)
  const dailyLosses = todayExpensesRaw.filter(e => e.category === 'Pertes').reduce((acc, e) => acc + e.amount, 0);

  // Daily stock restant value
  const todayRestants = stockRestants.filter(r => r.createdAt.startsWith(filterDateStr));
  const dailyStockRestantVal = todayRestants.reduce((acc, r) => acc + r.totalValue, 0);

  // Current Caisse endingCash & startingCash
  const registries = cashRegistries.filter(r => r.date === filterDateStr);
  const caisseActuelle = registries.length > 0 
    ? registries[0].endingCash 
    : (cashRegistries.length > 0 ? [...cashRegistries].sort((a,b) => b.date.localeCompare(a.date))[0].endingCash : 150000);
  const startingCash = registries.length > 0
    ? registries[0].startingCash
    : (cashRegistries.length > 0 ? [...cashRegistries].sort((a,b) => b.date.localeCompare(a.date))[0].startingCash : 150000);

  // Stock values
  const totalStockValue = products.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);
  const totalStockRemaining = products.reduce((acc, p) => acc + p.quantity, 0);

  // Debts
  const totalRemainingDebts = debts.reduce((acc, d) => acc + d.remainingAmount, 0);

  // Total Salaries paid overall
  const totalSalaries = salaries.reduce((acc, s) => acc + s.amountPaid, 0);

  // Net Profit (Admin only)
  // net_profit = Stock + Sales - Pertes - Expenses - Salaries - Debts
  const netProfit = totalStockValue + dailyCA - dailyLosses - dailyExpenses - totalSalaries - totalRemainingDebts;

  // Active employees on the selected date
  const jsDay = new Date(filterDateStr).getDay(); // 0 is Sunday, 1 is Monday...
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // map so Mon is 0, Sun is 6
  const activeEmployeesCount = employees.filter(e => e.active && e.workingDays[dayIndex]).length;

  // Daily target check
  const targetProgress = Math.min(Math.round((dailyCA / (dailyTarget || 1)) * 100), 100);

  // --- CHART 1: VENTES & BÉNÉFICES (Admin only for benefits) ---
  // Group sales, expenses, net profits by date for 7 days ending at selected date
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(filterDateStr);
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const chartDataWeekly = last7Days.map(dateStr => {
    const dateSales = sales.filter(s => s.createdAt.startsWith(dateStr));
    const dateExpensesRaw = expenses.filter(e => e.createdAt.startsWith(dateStr));
    const dateLosses = dateExpensesRaw.filter(e => e.category === 'Pertes');

    const salesTotal = dateSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const expensesTotal = dateExpensesRaw.filter(e => e.category !== 'Salaires' && e.category !== 'Pertes').reduce((acc, e) => acc + e.amount, 0);
    const salariesTotal = dateExpensesRaw.filter(e => e.category === 'Salaires').reduce((acc, e) => acc + e.amount, 0);
    const lossesTotal = dateLosses.reduce((acc, e) => acc + e.amount, 0);

    const profit = salesTotal - expensesTotal - salariesTotal - lossesTotal;

    return {
      date: getDayName(dateStr),
      Ventes: salesTotal,
      Dépenses: expensesTotal + salariesTotal,
      Bénéfice: profit
    };
  });

  // --- CHART 2: EXPENSES PIE CHART ---
  const expenseCategories = ['Eau', 'Tomates', 'Cube', 'Maggi', 'Piment', 'Huile', 'Oignons', 'Charbon', 'Transport', 'Glace', 'Salaires', 'Pertes', 'Divers'];
  const expenseDataPie = expenseCategories.map(cat => {
    const catExpenses = expenses.filter(e => e.category === cat);
    const total = catExpenses.reduce((acc, e) => acc + e.amount, 0);
    return { name: cat, value: total };
  }).filter(item => item.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b', '#a855f7', '#06b6d4', '#eab308', '#f97316'];

  // --- CHART 3: TOP SELLING PRODUCTS ---
  const productSalesMap = products.map(prod => {
    const qty = sales.filter(s => s.productId === prod.id).reduce((acc, s) => acc + s.quantity, 0);
    return { name: prod.name, Quantité: qty };
  }).sort((a, b) => b.Quantité - a.Quantité).slice(0, 5);

  // --- LOW STOCK ALERTS ---
  const lowStockProducts = products.filter(p => p.quantity < 30);

  // --- OUTSTANDING DEBTS ---
  const pendingDebts = debts.filter(d => d.status !== 'Payée').slice(0, 3);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img src={user.avatar} className="h-12 w-12 rounded-full object-cover border-2 border-emerald-500 shadow-md shrink-0" alt="Avatar" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Tableau de Bord
              </h1>
              <p className="text-slate-400 mt-1 font-medium text-xs">
                Ravi de vous revoir, {user?.fullName} · {butcheryName} · {new Date(filterDateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          
          {/* Date Selector input */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 self-start sm:self-auto shrink-0 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date :</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Quick info header status */}
        <div className="flex flex-wrap gap-3.5">
          <div className="flex items-center space-x-2.5 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
            <Wallet className="h-5 w-5 text-emerald-455" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Caisse de Départ</p>
              <p className="text-sm font-bold text-white">{formatFCFA(startingCash)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
            <UserCheck className="h-5 w-5 text-emerald-455" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Employés Actifs</p>
              <p className="text-sm font-bold text-white">{activeEmployeesCount} Présent(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Vendor Accounts Section (Admin only) */}
      {isAdmin && accounts.filter(acc => acc.status === 'pending').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-slate-900/50 border border-amber-500/20 rounded-3xl p-5 space-y-4 shadow-xl"
        >
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Clock size={16} className="animate-pulse" />
            <span>Demande(s) d'accès vendeurs en attente ({accounts.filter(acc => acc.status === 'pending').length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {accounts.filter(acc => acc.status === 'pending').map(acc => (
              <div key={acc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-950/80 border border-slate-850 rounded-2xl gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">{acc.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-light">Email: {acc.email} · Tél: {acc.phone} · Inscrit le: {new Date(acc.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex space-x-2.5 shrink-0">
                  <button
                    onClick={() => handleRejectAccount(acc.id)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-455 text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => handleApproveAccount(acc.id)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-450 text-slate-950 text-[10px] font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    Accepter l'accès
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Daily Progress Bar */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-1/3">
          <Target className="text-emerald-400 h-6 w-6 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-white">Progression de l'objectif de vente</h3>
            <p className="text-xs text-slate-500">Objectif quotidien : {formatFCFA(dailyTarget)}</p>
          </div>
        </div>
        <div className="w-full md:w-2/3 flex items-center space-x-4">
          <div className="flex-1 bg-slate-950 rounded-full h-3.5 border border-slate-800 overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${targetProgress}%` }}
              transition={{ duration: 1 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
            />
          </div>
          <span className="text-sm font-extrabold text-emerald-400 shrink-0">{targetProgress}%</span>
        </div>
      </div>

      {/* KPI GRID */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* CA du Jour */}
        <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-850 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires (Jour)</p>
              <h2 className="text-2xl font-black text-white mt-2 truncate">{formatFCFA(dailyCA)}</h2>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium flex items-center mt-3">
            <ArrowUpRight size={12} className="mr-0.5" /> En hausse de 12% vs hier
          </div>
        </motion.div>

        {/* Caisse Actuelle */}
        <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-850 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Caisse en Cours</p>
              <h2 className="text-2xl font-black text-white mt-2 truncate">{formatFCFA(caisseActuelle)}</h2>
            </div>
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl">
              <Wallet size={22} />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-3">
            Solde disponible dans le tiroir caisse
          </div>
        </motion.div>

        {/* Valeur du Stock */}
        <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-850 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valeur du Stock</p>
              <h2 className="text-2xl font-black text-white mt-2 truncate">{formatFCFA(totalStockValue)}</h2>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
              <Boxes size={22} />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-medium flex items-center mt-3">
            Total : {totalStockRemaining} pièces
          </div>
        </motion.div>

        {/* Bénéfice Net (Admin only, otherwise hidden/replaced with Products Sold) */}
        {isAdmin ? (
          <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-850 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[120px] bg-gradient-to-br from-slate-900 to-emerald-950/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-emerald-450 uppercase tracking-wider">Bénéfice Net en Cours (Jour)</p>
                <h2 className={`text-2xl font-black mt-2 truncate ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatFCFA(netProfit)}
                </h2>
              </div>
              <div className="p-3 bg-emerald-450/10 text-emerald-450 rounded-2xl">
                <PiggyBank size={22} />
              </div>
            </div>
             <div className="text-[10px] text-emerald-455/80 font-medium mt-3">
               Calculé : Stock + Ventes - Pertes - Dépenses - Salaires - Dettes
             </div>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-850 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Produits Vendus (Jour)</p>
                <h2 className="text-2xl font-black text-white mt-2 truncate">{productsSoldToday} pièces</h2>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
                <ShoppingCart size={22} />
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-3">
              Total des articles vendus aujourd'hui
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* SECONDARY KPI ROW (Mini Stats) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Dépenses du Jour */}
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dépenses (Jour)</p>
          <p className="text-lg font-extrabold text-white mt-1">{formatFCFA(dailyExpenses)}</p>
        </div>

        {/* Salaires payés */}
        {isAdmin ? (
          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Salaires Payés</p>
            <p className="text-lg font-extrabold text-white mt-1">{formatFCFA(totalSalaries)}</p>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stock Restant Total</p>
            <p className="text-lg font-extrabold text-white mt-1">{totalStockRemaining} pcs</p>
          </div>
        )}

        {/* Pertes/Sorties */}
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pertes du Jour</p>
          <p className="text-lg font-extrabold text-rose-400 mt-1">{formatFCFA(dailyLosses)}</p>
        </div>

        {/* Dettes Fournisseurs (Admin only, otherwise hidden/replaced with client display) */}
        {isAdmin ? (
          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dettes Fournisseurs</p>
            <p className="text-lg font-extrabold text-amber-400 mt-1">{formatFCFA(totalRemainingDebts)}</p>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catégories Produits</p>
            <p className="text-lg font-extrabold text-white mt-1">5 Catégories</p>
          </div>
        )}

        {/* Stock Alert Status */}
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl col-span-2 md:col-span-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alertes Stock</p>
          <p className={`text-lg font-extrabold mt-1 ${lowStockProducts.length > 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
            {lowStockProducts.length} Alerte(s)
          </p>
        </div>
      </div>

      {/* GRAPHICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Ventes / Bénéfices) */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-md font-bold text-white">Évolution Financière (7 derniers jours)</h3>
              <p className="text-xs text-slate-500">Comparaison Ventes vs Dépenses / Bénéfices</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-slate-850 text-slate-400 rounded-md">Hebdomadaire</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataWeekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  {isAdmin && (
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Ventes" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                {isAdmin && (
                  <Area type="monotone" dataKey="Bénéfice" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                )}
                <Area type="monotone" dataKey="Dépenses" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Pie Chart */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-white">Répartition des Dépenses</h3>
            <p className="text-xs text-slate-500 mb-6">Par catégories cumulées</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center relative">
            {expenseDataPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseDataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseDataPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-xs py-8">
                Aucune dépense enregistrée sur cette période.
              </div>
            )}
            {expenseDataPie.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total</span>
                <span className="text-sm font-extrabold text-white">
                  {formatFCFA(expenses.reduce((acc, e) => acc + e.amount, 0))}
                </span>
              </div>
            )}
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 gap-2 mt-4 max-h-24 overflow-y-auto text-[10px]">
            {expenseDataPie.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-slate-400 truncate">{entry.name}</span>
                <span className="text-white font-bold">{formatFCFA(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WIDGETS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-md font-bold text-white flex items-center">
              <Clock className="text-emerald-400 mr-2 h-5 w-5" />
              Activités Récentes
            </h3>
            <p className="text-xs text-slate-500">Mises à jour opérationnelles en temps réel</p>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-72 pr-1">
            {activityLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex space-x-3 text-xs border-b border-slate-850 pb-3 last:border-0 last:pb-0">
                <div className="bg-slate-850 p-2 rounded-lg text-emerald-400 shrink-0 h-8 w-8 flex items-center justify-center">
                  <ChevronRight size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-300 truncate">{log.action}</p>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 font-light mt-0.5 break-words">{log.details}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Par: {log.userName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-md font-bold text-white flex items-center">
              <AlertTriangle className="text-amber-500 mr-2 h-5 w-5" />
              Alerte de Stock Faible
            </h3>
            <p className="text-xs text-slate-500">Produits avec moins de 30 pièces</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-72 pr-1">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(prod => (
                <div key={prod.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-850">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300">{prod.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{prod.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                      {prod.quantity} pièces
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1.5">Unitaire : {formatFCFA(prod.unitPrice)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                <span className="text-xs">Aucun produit en stock faible. Félicitations !</span>
              </div>
            )}
          </div>
        </div>

        {/* Outstanding Debts & Top Products */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl flex flex-col justify-between space-y-6">
          {/* Top Products */}
          <div>
            <div className="mb-4">
              <h3 className="text-md font-bold text-white">Produits les plus vendus</h3>
              <p className="text-xs text-slate-500">Volume total des ventes</p>
            </div>
            <div className="space-y-3">
              {productSalesMap.slice(0, 3).map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-slate-350">
                    <span className="font-bold text-slate-500 w-4">{idx + 1}.</span>
                    <span className="text-slate-300 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {item.Quantité} pièces
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dettes à payer (Admin only, otherwise generic information) */}
          {isAdmin ? (
            <div>
              <div className="mb-4">
                <h3 className="text-md font-bold text-white flex items-center">
                  <CircleDollarSign className="text-amber-500 mr-2 h-5 w-5" />
                  Dettes à Régler
                </h3>
                <p className="text-xs text-slate-500">Échéances fournisseurs critiques</p>
              </div>

              <div className="space-y-2">
                {pendingDebts.length > 0 ? (
                  pendingDebts.map(debt => (
                    <div key={debt.id} className="flex justify-between items-center text-xs p-2 bg-slate-950/60 rounded-xl border border-slate-850">
                      <div>
                        <p className="font-bold text-slate-300">{debt.supplierName}</p>
                        <p className="text-[9px] text-rose-400 font-medium">Échéance : {debt.dueDate || 'Non définie'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatFCFA(debt.remainingAmount)}</p>
                        <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded uppercase font-bold">
                          {debt.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">Aucune dette fournisseur en attente.</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-300">Méthodes de Paiement (Aujourd'hui)</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Espèces', 'Mobile Money', 'Carte', 'Autre'].map(method => {
                  const amt = todaySales.filter(s => s.paymentMethod === method).reduce((acc, s) => acc + s.totalAmount, 0);
                  return (
                    <div key={method} className="bg-slate-950 p-2 rounded-xl border border-slate-850 text-center">
                      <p className="text-slate-500 text-[10px] font-bold">{method}</p>
                      <p className="text-white font-extrabold mt-0.5">{formatFCFA(amt)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Realtime Toast Notification */}
      <AnimatePresence>
        {newRegistrationToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 max-w-md bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl shadow-2xl flex items-center space-x-3 backdrop-blur-md"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <UserCheck size={18} className="animate-bounce" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-extrabold text-white">Nouvelle Demande d'Accès</p>
              <p className="text-slate-350 font-light mt-0.5">{newRegistrationToast}</p>
            </div>
            <button
              onClick={() => setNewRegistrationToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Product, Sale, Expense, Output, Debt, Employee, CashRegistry, StockRestant, Salary } from '@/lib/db/store';
import { formatFCFA, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  FileBarChart2, 
  Printer, 
  FileSpreadsheet, 
  Lock,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Coins,
  Warehouse
} from 'lucide-react';

export default function RapportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockRestants, setStockRestants] = useState<StockRestant[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);

  // Period state
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = () => {
    setSales(LocalDbStore.getSales());
    setExpenses(LocalDbStore.getExpenses());
    setOutputs(LocalDbStore.getOutputs());
    setDebts(LocalDbStore.getDebts());
    setProducts(LocalDbStore.getProducts());
    setStockRestants(LocalDbStore.getStockRestants());
    setSalaries(LocalDbStore.getSalaries());
  };

  if (!isAdmin) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center text-center p-6 bg-slate-900/30 border border-slate-800 rounded-3xl">
        <Lock className="h-16 w-16 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-black text-white">Accès Restreint</h2>
        <p className="text-slate-400 text-sm max-w-sm mt-2">
          Le module de rapports financiers complets n'est accessible qu'aux comptes Administrateurs.
        </p>
      </div>
    );
  }

  // --- STATS FILTERING BY PERIOD ---
  const now = new Date();
  
  const filteredSales = sales.filter(s => {
    const sDate = new Date(s.createdAt);
    if (period === 'day') {
      return s.createdAt.startsWith(now.toISOString().split('T')[0]);
    } else if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return sDate >= oneWeekAgo;
    } else if (period === 'month') {
      return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
    } else {
      return sDate.getFullYear() === now.getFullYear();
    }
  });

  const filteredExpensesRaw = expenses.filter(e => {
    const eDate = new Date(e.createdAt);
    if (period === 'day') {
      return e.createdAt.startsWith(now.toISOString().split('T')[0]);
    } else if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return eDate >= oneWeekAgo;
    } else if (period === 'month') {
      return eDate.getMonth() === now.getMonth() && eDate.getFullYear() === now.getFullYear();
    } else {
      return eDate.getFullYear() === now.getFullYear();
    }
  });

  const filteredOutputs = outputs.filter(o => {
    const oDate = new Date(o.createdAt);
    if (period === 'day') {
      return o.createdAt.startsWith(now.toISOString().split('T')[0]);
    } else if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return oDate >= oneWeekAgo;
    } else if (period === 'month') {
      return oDate.getMonth() === now.getMonth() && oDate.getFullYear() === now.getFullYear();
    } else {
      return oDate.getFullYear() === now.getFullYear();
    }
  });

  const filteredDebts = debts.filter(d => {
    const dDate = new Date(d.createdAt);
    if (period === 'day') {
      return d.createdAt.startsWith(now.toISOString().split('T')[0]);
    } else if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return dDate >= oneWeekAgo;
    } else if (period === 'month') {
      return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
    } else {
      return dDate.getFullYear() === now.getFullYear();
    }
  });

  const filteredStockRestants = stockRestants.filter(sr => {
    const srDate = new Date(sr.createdAt);
    if (period === 'day') {
      return sr.createdAt.startsWith(now.toISOString().split('T')[0]);
    } else if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return srDate >= oneWeekAgo;
    } else if (period === 'month') {
      return srDate.getMonth() === now.getMonth() && srDate.getFullYear() === now.getFullYear();
    } else {
      return srDate.getFullYear() === now.getFullYear();
    }
  });

  const filteredSalaries = salaries.filter(s => {
    const sDate = new Date(s.createdAt);
    if (period === 'day') {
      return s.createdAt.startsWith(now.toISOString().split('T')[0]);
    } else if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return sDate >= oneWeekAgo;
    } else if (period === 'month') {
      return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
    } else {
      return sDate.getFullYear() === now.getFullYear();
    }
  });

  // Calculate stats
  const totalSales = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalExpenses = filteredExpensesRaw.filter(e => e.category !== 'Salaires' && e.category !== 'Pertes').reduce((acc, e) => acc + e.amount, 0);
  const totalSalaries = filteredSalaries.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalLosses = filteredExpensesRaw.filter(e => e.category === 'Pertes').reduce((acc, e) => acc + e.amount, 0);
  const totalDebts = debts.reduce((acc, d) => acc + d.remainingAmount, 0);

  // Valuation of inventory
  const totalStockVal = products.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);

  // Benefits
  // grossBenefit = Ventes + Valeur Stock - Pertes
  const grossBenefit = totalSales + totalStockVal - totalLosses;
  // netBenefit = grossBenefit - Dépenses - Salaires - Dettes
  const netBenefit = grossBenefit - totalExpenses - totalSalaries - totalDebts;

  // --- ACTIONS: EXPORTS ---
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Indicateur Bilan', 'Montant (FCFA)'];
    const rows = [
      ['Chiffre d\'Affaires (CA)', totalSales],
      ['Dépenses Opérationnelles', totalExpenses],
      ['Salaires Payés', totalSalaries],
      ['Dettes Fournisseurs Créées', totalDebts],
      ['Valeur Estimée du Stock', totalStockVal],
      ['Bénéfice Brut', grossBenefit],
      ['Bénéfice Net', netBenefit]
    ];

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += headers.join(';') + '\r\n';
    rows.forEach(row => {
      csvContent += row.join(';') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rapport_${period}_BoucherieArafat.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 select-none print:bg-white print:text-black">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <FileBarChart2 className="text-emerald-450 mr-2 h-8 w-8" />
            Rapports d'Activité
          </h1>
          <p className="text-slate-400 mt-1">Consultez et exportez les comptes d'exploitation de la boucherie.</p>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 hover:text-white rounded-2xl font-bold cursor-pointer transition-colors"
          >
            <FileSpreadsheet size={18} className="text-emerald-450" />
            <span>Excel (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold cursor-pointer transition-colors"
          >
            <Printer size={18} />
            <span>Imprimer PDF</span>
          </button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block text-center border-b pb-6 mb-6">
        <h1 className="text-2xl font-bold">ARAFAT COMPTA - RAPPORT FINANCIER D'EXPLOITATION</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bilan de Période : {period === 'day' ? 'Journalier' : period === 'week' ? 'Hebdomadaire' : period === 'month' ? 'Mensuel' : 'Annuel'}
        </p>
        <p className="text-xs text-gray-400">Date d'impression : {new Date().toLocaleString('fr-FR')}</p>
      </div>

      {/* Tabs (Day, Week, Month, Year) */}
      <div className="flex border-b border-slate-800 print:hidden justify-between sm:justify-start">
        {['day', 'week', 'month', 'year'].map(tab => (
          <button
            key={tab}
            onClick={() => setPeriod(tab as any)}
            className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              period === tab
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-350'
            }`}
          >
            {tab === 'day' ? 'Journalier' : tab === 'week' ? 'Hebdomadaire' : tab === 'month' ? 'Mensuel' : 'Annuel'}
          </button>
        ))}
      </div>

      {/* Financial calculations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl print:border print:bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Chiffre d'Affaires</span>
            <TrendingUp className="text-emerald-450" size={16} />
          </div>
          <h2 className="text-2xl font-black text-white mt-4 print:text-black">{formatFCFA(totalSales)}</h2>
          <span className="text-[9px] text-slate-500 mt-2 block">{filteredSales.length} transactions</span>
        </div>

        {/* Expenses */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl print:border print:bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dépenses Opér.</span>
            <Receipt className="text-rose-455" size={16} />
          </div>
          <h2 className="text-2xl font-black text-white mt-4 print:text-black">{formatFCFA(totalExpenses)}</h2>
          <span className="text-[9px] text-slate-500 mt-2 block">Dépenses d'exploitation courantes</span>
        </div>

        {/* Salaries */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl print:border print:bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Salaires Payés</span>
            <Coins className="text-amber-500" size={16} />
          </div>
          <h2 className="text-2xl font-black text-white mt-4 print:text-black">{formatFCFA(totalSalaries)}</h2>
          <span className="text-[9px] text-slate-500 mt-2 block">Paiements journaliers personnel</span>
        </div>

        {/* Stock Value */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl print:border print:bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Valeur Stock</span>
            <Warehouse className="text-indigo-400" size={16} />
          </div>
          <h2 className="text-2xl font-black text-white mt-4 print:text-black">{formatFCFA(totalStockVal)}</h2>
          <span className="text-[9px] text-slate-500 mt-2 block">Valorisation au prix unitaire</span>
        </div>
      </div>

      {/* Main Income Sheet Table */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden print:border print:bg-white">
        <div className="p-5 border-b border-slate-800 bg-slate-950/20 print:bg-gray-100">
          <h3 className="text-sm font-bold text-white print:text-black">Compte de Résultat Simplifié ({period.toUpperCase()})</h3>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <tbody className="divide-y divide-slate-800 text-slate-300 print:text-gray-900">
            {/* Ventes */}
            <tr className="hover:bg-slate-850/20 transition-colors">
              <td className="py-4 px-6 font-medium">Chiffre d'Affaires Brut (Ventes)</td>
              <td className="py-4 px-6 text-right font-extrabold text-emerald-400 print:text-black">+{formatFCFA(totalSales)}</td>
            </tr>

            {/* Valeur du Stock au Frigo */}
            <tr className="hover:bg-slate-850/20 transition-colors">
              <td className="py-4 px-6 font-medium">Valeur du Stock au Frigo</td>
              <td className="py-4 px-6 text-right font-extrabold text-emerald-400 print:text-black">+{formatFCFA(totalStockVal)}</td>
            </tr>

            {/* Pertes */}
            <tr className="hover:bg-slate-850/20 transition-colors">
              <td className="py-4 px-6 font-medium">Pertes (Avaries, vols, etc.)</td>
              <td className="py-4 px-6 text-right font-extrabold text-rose-455">-{formatFCFA(totalLosses)}</td>
            </tr>

            {/* Bénéfice brut */}
            <tr className="bg-slate-950/30 print:bg-gray-50 border-y border-slate-800 font-extrabold text-white print:text-black">
              <td className="py-4 px-6">BÉNÉFICE BRUT D'EXPLOITATION</td>
              <td className="py-4 px-6 text-right text-emerald-450">{formatFCFA(grossBenefit)}</td>
            </tr>

            {/* Dépenses */}
            <tr className="hover:bg-slate-850/20 transition-colors">
              <td className="py-4 px-6 font-medium">Charges d'Exploitation (Eau, Oignons, Transport...)</td>
              <td className="py-4 px-6 text-right font-extrabold text-rose-455">-{formatFCFA(totalExpenses)}</td>
            </tr>

            {/* Salaires */}
            <tr className="hover:bg-slate-850/20 transition-colors">
              <td className="py-4 px-6 font-medium">Charges de Personnel (Salaires)</td>
              <td className="py-4 px-6 text-right font-extrabold text-rose-455">-{formatFCFA(totalSalaries)}</td>
            </tr>

            {/* Dettes */}
            <tr className="hover:bg-slate-850/20 transition-colors">
              <td className="py-4 px-6 font-medium">Dettes Fournisseurs Créées (Non réglées)</td>
              <td className="py-4 px-6 text-right font-extrabold text-rose-455">-{formatFCFA(totalDebts)}</td>
            </tr>

            {/* Bénéfice net */}
            <tr className="bg-slate-950/60 print:bg-gray-100 border-t-2 border-slate-850 font-black text-sm text-white print:text-black">
              <td className="py-4.5 px-6">BÉNÉFICE NET EN COURS</td>
              <td className={`py-4.5 px-6 text-right ${netBenefit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatFCFA(netBenefit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Print Signatures */}
      <div className="hidden print:flex justify-between mt-16 text-xs pt-8 border-t border-gray-300">
        <div>
          <p className="font-bold">Visa Comptable</p>
          <div className="h-20 w-40 border-b border-dashed border-gray-400" />
        </div>
        <div className="text-right">
          <p className="font-bold">Visa Directeur Général</p>
          <div className="h-20 w-40 border-b border-dashed border-gray-400 ml-auto" />
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Debt, DebtPayment, Supplier } from '@/lib/db/store';
import { formatFCFA, formatDate, formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  X,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  History,
  Lock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function DettesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending');
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  // Modals
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [debtToDeleteId, setDebtToDeleteId] = useState('');

  // New Debt Form
  const [supplierId, setSupplierId] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [debtError, setDebtError] = useState('');

  // Payment Form
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentError, setPaymentError] = useState('');

  const loadData = () => {
    const d = LocalDbStore.getDebts();
    const p = LocalDbStore.getDebtPayments();
    const s = LocalDbStore.getSuppliers();
    setDebts(d);
    setPayments(p);
    setSuppliers(s);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDebtModal = () => {
    setEditingDebt(null);
    const sups = LocalDbStore.getSuppliers();
    setSuppliers(sups);
    if (sups.length > 0) {
      setSupplierId(sups[0].id);
    } else {
      setSupplierId('');
    }
    setTotalAmount(0);
    setDueDate('');
    setDebtError('');
    setIsDebtModalOpen(true);
  };

  const handleOpenEditDebtModal = (debt: Debt) => {
    setEditingDebt(debt);
    const sups = LocalDbStore.getSuppliers();
    setSuppliers(sups);
    setSupplierId(debt.supplierId);
    setTotalAmount(debt.totalAmount);
    setDueDate(debt.dueDate ? debt.dueDate.split('T')[0] : '');
    setDebtError('');
    setIsDebtModalOpen(true);
  };

  const triggerDeleteDebt = (id: string) => {
    setDebtToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteDebt = () => {
    try {
      LocalDbStore.deleteDebt(debtToDeleteId, user?.fullName || 'Administrateur');
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setAmountPaid(0);
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    setDebtError('');

    if (!supplierId) {
      setDebtError('Veuillez sélectionner un fournisseur.');
      return;
    }
    if (totalAmount < 0) {
      setDebtError('Le montant de la dette ne peut pas être négatif.');
      return;
    }

    try {
      const payload = {
        supplierId,
        totalAmount,
        dueDate: dueDate || undefined
      };

      const userName = user?.fullName || 'Administrateur';

      if (editingDebt) {
        LocalDbStore.updateDebt(editingDebt.id, payload, userName);
      } else {
        LocalDbStore.addDebt({
          ...payload,
          paidAmount: 0
        }, userName);
      }

      setIsDebtModalOpen(false);
      loadData();
    } catch (err: any) {
      setDebtError(err.message || 'Une erreur est survenue.');
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (!selectedDebt) return;
    if (amountPaid < 0) {
      setPaymentError('Le montant payé ne peut pas être négatif.');
      return;
    }
    if (amountPaid > selectedDebt.remainingAmount) {
      setPaymentError(`Le paiement dépasse le solde restant (${formatFCFA(selectedDebt.remainingAmount)})`);
      return;
    }

    try {
      LocalDbStore.addDebtPayment({
        debtId: selectedDebt.id,
        amountPaid,
        recordedBy: user?.fullName || 'Administrateur'
      }, user?.fullName || 'Administrateur');

      setIsPaymentModalOpen(false);
      loadData();
    } catch (err: any) {
      setPaymentError(err.message || 'Une erreur est survenue.');
    }
  };

  const toggleExpandDebt = (id: string) => {
    setExpandedDebtId(expandedDebtId === id ? null : id);
  };

  // Filter debts
  const filteredDebts = debts.filter(d => {
    const matchesSearch = d.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'pending' ? d.status !== 'Payée' : d.status === 'Payée';
    return matchesSearch && matchesTab;
  });

  const totalOutstanding = debts.filter(d => d.status !== 'Payée').reduce((acc, d) => acc + d.remainingAmount, 0);

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <FileSpreadsheet className="text-amber-500 mr-2 h-8 w-8" />
            Dettes aux Fournisseurs
          </h1>
          <p className="text-slate-400 mt-1">Gérez vos engagements financiers auprès de vos éleveurs et fournisseurs.</p>
        </div>

        <button
          onClick={handleOpenDebtModal}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-bold shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus size={18} />
          <span>Enregistrer une Dette</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => { setActiveTab('pending'); setExpandedDebtId(null); }}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'pending'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          <AlertCircle size={16} />
          <span>Dettes en Cours</span>
        </button>
        <button
          onClick={() => { setActiveTab('settled'); setExpandedDebtId(null); }}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'settled'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>Dettes Réglées (Historique)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search Input */}
        <div className="relative md:col-span-3">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par fournisseur..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Total Outstanding Card */}
        {activeTab === 'pending' && (
          <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Restant à Payer</span>
            <p className="text-md font-black text-amber-400 mt-0.5">{formatFCFA(totalOutstanding)}</p>
          </div>
        )}
      </div>

      {/* Table List */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="w-8"></th>
                <th className="py-4 px-6">Fournisseur</th>
                <th className="py-4 px-6 text-right">Montant Initial</th>
                <th className="py-4 px-6 text-right">Déjà Payé</th>
                <th className="py-4 px-6 text-right">Reste à Payer</th>
                <th className="py-4 px-6">Échéance</th>
                <th className="py-4 px-6">Statut</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-350">
              {filteredDebts.length > 0 ? (
                filteredDebts.map(debt => {
                  const isExpanded = expandedDebtId === debt.id;
                  const debtPayments = payments.filter(p => p.debtId === debt.id);

                  return (
                    <React.Fragment key={debt.id}>
                      <tr className={`hover:bg-slate-850/30 transition-colors border-b border-slate-800/50 ${isExpanded ? 'bg-slate-850/20' : ''}`}>
                        <td className="py-4 pl-4 text-center">
                          <button
                            onClick={() => toggleExpandDebt(debt.id)}
                            className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                        <td className="py-4 px-6 font-bold text-white">{debt.supplierName}</td>
                        <td className="py-4 px-6 text-right font-semibold text-slate-400">{formatFCFA(debt.totalAmount)}</td>
                        <td className="py-4 px-6 text-right font-semibold text-emerald-450">{formatFCFA(debt.paidAmount)}</td>
                        <td className="py-4 px-6 text-right font-extrabold text-amber-400">
                          {formatFCFA(debt.remainingAmount)}
                        </td>
                        <td className="py-4 px-6 text-slate-450 font-medium">
                          {debt.dueDate ? formatDate(debt.dueDate) : 'Aucune'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[9px] uppercase ${
                            debt.status === 'Payée' ? 'bg-emerald-500/10 text-emerald-400' :
                            debt.status === 'Partiellement payée' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-rose-500/10 text-rose-455'
                          }`}>
                            {debt.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center items-center space-x-2">
                            {debt.status !== 'Payée' ? (
                              <button
                                onClick={() => handleOpenPaymentModal(debt)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-450 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                title="Verser un acompte"
                              >
                                Verser
                              </button>
                            ) : (
                              <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg text-[10px] font-bold">Soldée</span>
                            )}
                            <button
                              onClick={() => handleOpenEditDebtModal(debt)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-450 rounded-lg transition-colors cursor-pointer"
                              title="Modifier la dette"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => triggerDeleteDebt(debt.id)}
                              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer la dette"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Payments History sub-table */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="bg-slate-950/60 p-4 border-b border-slate-800">
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-300 flex items-center">
                                  <History className="h-4 w-4 mr-1 text-emerald-400" />
                                  Historique des paiements ({debtPayments.length})
                                </h4>
                                {debtPayments.length > 0 ? (
                                  <div className="max-w-xl bg-slate-900/60 rounded-xl border border-slate-850 overflow-hidden">
                                    <table className="w-full text-left border-collapse text-[11px]">
                                      <thead>
                                        <tr className="bg-slate-950/40 text-slate-550 border-b border-slate-800 font-bold uppercase tracking-wider">
                                          <th className="py-2 px-4">Date</th>
                                          <th className="py-2 px-4 text-right">Montant Versé</th>
                                          <th className="py-2 px-4">Enregistré Par</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-800/50 text-slate-400">
                                        {debtPayments.map(p => (
                                          <tr key={p.id} className="hover:bg-slate-850/20">
                                            <td className="py-2.5 px-4">
                                              {formatDate(p.createdAt)} · <span className="text-[9px] text-slate-500">{formatTime(p.createdAt)}</span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-bold text-emerald-400">{formatFCFA(p.amountPaid)}</td>
                                            <td className="py-2.5 px-4 font-medium">{p.recordedBy}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-500 italic pl-5">Aucun versement n'a encore été enregistré pour cette dette.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-35 text-slate-400" />
                    <span>Aucune dette enregistrée pour cet onglet.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Debt Modal */}
      <AnimatePresence>
        {isDebtModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDebtModalOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                <h3 className="text-lg font-extrabold text-white flex items-center">
                  <Sparkles className="text-amber-500 mr-2 h-5 w-5" />
                  {editingDebt ? 'Modifier la Dette' : 'Enregistrer une Dette'}
                </h3>
                <button
                  onClick={() => setIsDebtModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {debtError && (
                <div className="my-4 p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-200 text-xs flex items-center space-x-2">
                  <Info size={16} className="text-rose-400 flex-shrink-0" />
                  <span>{debtError}</span>
                </div>
              )}

              <form onSubmit={handleSaveDebt} className="space-y-4 mt-4">
                {/* Supplier selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fournisseur</label>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Choisir un fournisseur --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Montant Total de la Dette (FCFA)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={totalAmount || ''}
                    onChange={e => setTotalAmount(Number(e.target.value))}
                    placeholder="Ex: 250000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Échéance (Optionnelle)</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsDebtModalOpen(false)}
                    className="w-1/2 py-3 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    {editingDebt ? 'Enregistrer les Modifications' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                <h3 className="text-lg font-extrabold text-white flex items-center">
                  <DollarSign className="text-emerald-400 mr-2 h-5 w-5" />
                  Enregistrer un Versement
                </h3>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {paymentError && (
                <div className="my-4 p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-200 text-xs flex items-center space-x-2">
                  <Info size={16} className="text-rose-400 flex-shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Debt Stats inside payment */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fournisseur :</span>
                  <span className="font-bold text-white">{selectedDebt.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant Initial :</span>
                  <span className="font-bold text-slate-300">{formatFCFA(selectedDebt.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Déjà payé :</span>
                  <span className="font-bold text-emerald-400">{formatFCFA(selectedDebt.paidAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-850 font-bold">
                  <span className="text-slate-400">Reste à payer :</span>
                  <span className="text-amber-400">{formatFCFA(selectedDebt.remainingAmount)}</span>
                </div>
              </div>

              <form onSubmit={handleSavePayment} className="space-y-4 mt-4">
                {/* Paid Amount */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Montant du Versement (FCFA)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={selectedDebt.remainingAmount}
                    value={amountPaid || ''}
                    onChange={e => setAmountPaid(Number(e.target.value))}
                    placeholder="Ex: 50000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Date */}
                <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-[10px] text-slate-500">
                  <span>DATE DE PAIEMENT LOGUÉE :</span>
                  <span className="font-bold text-slate-400">{new Date().toLocaleDateString()}</span>
                </div>

                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="w-1/2 py-3 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Enregistrer Paiement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Supprimer la dette"
        message="Êtes-vous sûr de vouloir supprimer cette dette ? Cette action est irréversible."
        onConfirm={handleConfirmDeleteDebt}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}

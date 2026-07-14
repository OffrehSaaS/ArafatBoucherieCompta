'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Product, Output } from '@/lib/db/store';
import { formatFCFA, formatDate, formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Edit3,
  Search, 
  X,
  Sparkles,
  Info,
  TrendingDown
} from 'lucide-react';

export default function SortiesPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutput, setEditingOutput] = useState<Output | null>(null);

  // Form State
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [sortieDate, setSortieDate] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [error, setError] = useState('');

  // Validation Modal State
  const [isValidatingModalOpen, setIsValidatingModalOpen] = useState(false);
  const [validatingOutput, setValidatingOutput] = useState<Output | null>(null);
  const [remainingQty, setRemainingQty] = useState<number | ''>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Espèces' | 'Mobile Money' | 'Carte' | 'Autre'>('Espèces');

  // Confirm dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [outputToDeleteId, setOutputToDeleteId] = useState<string | null>(null);

  // Batch delete states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(LocalDbStore.getProducts());
    setOutputs(LocalDbStore.getOutputs().sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
    setSelectedIds([]);
  };

  const handleOpenModal = () => {
    setEditingOutput(null);
    const prods = LocalDbStore.getProducts();
    const activeProds = prods.filter(p => p.quantity > 0);
    setProducts(prods);
    if (activeProds.length > 0) {
      setProductId(activeProds[0].id);
    } else {
      setProductId('');
    }
    setQuantity(0);
    setTotalValue(0);
    setNotes('');
    setSortieDate(new Date().toISOString().split('T')[0]);
    setEmployeeName(user?.fullName || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (output: Output) => {
    setEditingOutput(output);
    setProducts(LocalDbStore.getProducts());
    setProductId(output.productId);
    setQuantity(output.quantity);
    setTotalValue(output.quantity * output.unitPrice);
    setNotes(output.notes);
    setSortieDate(output.createdAt.split('T')[0]);
    setEmployeeName(output.employeeName);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenValidateModal = (output: Output) => {
    setValidatingOutput(output);
    setRemainingQty(0);
    setPaymentMethod('Espèces');
    setError('');
    setIsValidatingModalOpen(true);
  };

  const handleSaveValidation = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatingOutput) return;

    if (remainingQty === '') {
      setError('Veuillez saisir la quantité restante.');
      return;
    }
    if (remainingQty < 0) {
      setError('La quantité restante ne peut pas être négative.');
      return;
    }
    if (remainingQty > validatingOutput.quantity) {
      setError(`Le restant (${remainingQty}) ne peut pas dépasser la quantité initialement sortie (${validatingOutput.quantity}).`);
      return;
    }

    try {
      LocalDbStore.validateOutput(
        validatingOutput.id,
        remainingQty,
        paymentMethod,
        user?.fullName || 'Utilisateur'
      );
      setIsValidatingModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!productId) {
      setError('Veuillez sélectionner un produit.');
      return;
    }
    if (quantity <= 0) {
      setError('Veuillez spécifier une quantité valide (supérieure à 0).');
      return;
    }

    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) {
      setError('Produit introuvable.');
      return;
    }

    // Temporary quantity calculation: add back the output quantity if we are modifying it
    const availableQty = selectedProduct.quantity + (editingOutput && editingOutput.productId === productId ? editingOutput.quantity : 0);

    if (availableQty < quantity) {
      setError(`Stock insuffisant. Quantité disponible maximale: ${availableQty} pièces.`);
      return;
    }

    const userName = user?.fullName || 'Utilisateur';
    const finalEmployeeName = employeeName || userName;

    try {
      if (editingOutput) {
        LocalDbStore.updateOutput(
          editingOutput.id,
          quantity,
          notes,
          userName,
          editingOutput.status === 'valide' ? editingOutput.remainingQuantity : undefined,
          editingOutput.status === 'valide' ? editingOutput.paymentMethod : undefined,
          employeeName
        );
      } else {
        const payload = {
          productId,
          quantity,
          unitPrice: selectedProduct.unitPrice,
          employeeName: finalEmployeeName,
          notes,
          createdAt: sortieDate ? new Date(sortieDate + 'T12:00:00Z').toISOString() : undefined
        };
        LocalDbStore.addOutput(payload, userName);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  const handleDelete = (id: string) => {
    setOutputToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (outputToDeleteId) {
      try {
        LocalDbStore.deleteOutput(outputToDeleteId, user?.fullName || 'Utilisateur');
        setIsConfirmOpen(false);
        setOutputToDeleteId(null);
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredOutputs.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    setIsBatchConfirmOpen(true);
  };

  const handleConfirmDeleteSelected = () => {
    try {
      const userName = user?.fullName || 'Utilisateur';
      for (const id of selectedIds) {
        LocalDbStore.deleteOutput(id, userName);
      }
      setSelectedIds([]);
      setIsBatchConfirmOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue.');
    }
  };

  // Filter outputs
  const filteredOutputs = outputs.filter(o => {
    const itemDate = o.createdAt.split('T')[0];
    const matchStart = !startDateFilter || itemDate >= startDateFilter;
    const matchEnd = !endDateFilter || itemDate <= endDateFilter;
    const matchesSearch = o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.notes.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStart && matchEnd && matchesSearch;
  });

  const selectedProduct = products.find(p => p.id === productId);
  const totalSortiesValue = filteredOutputs.reduce((acc, o) => acc + (o.quantity * o.unitPrice), 0);
  const totalSalesValue = filteredOutputs.filter(o => o.status === 'valide').reduce((acc, o) => acc + o.totalAmount, 0);

  // Available stock dynamic display
  const displayAvailableQty = selectedProduct 
    ? selectedProduct.quantity + (editingOutput && editingOutput.productId === productId ? editingOutput.quantity : 0)
    : 0;

  // Helper to determine day of week index (0 = Monday, ..., 6 = Sunday)
  const getDayOfWeekIndex = (dateStr: string) => {
    if (!dateStr) return -1;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    return (dayOfWeek + 6) % 7;
  };

  // Get employee candidates for the selected date
  const dayIndex = getDayOfWeekIndex(sortieDate);
  const activeAccounts = LocalDbStore.getAccounts()
    .filter(acc => acc.status === 'active')
    .map(acc => acc.fullName);
  const allEmployees = LocalDbStore.getEmployees();
  const activeEmployeesToday = allEmployees
    .filter(emp => emp.active && (dayIndex === -1 || emp.workingDays[dayIndex]))
    .map(emp => `${emp.firstName} ${emp.lastName}`);

  const employeeCandidates = Array.from(new Set([...activeAccounts, ...activeEmployeesToday]));
  if (employeeName && !employeeCandidates.includes(employeeName)) {
    employeeCandidates.push(employeeName);
  }

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <ArrowUpRight className="text-rose-450 mr-2 h-8 w-8" />
            Sortie du Frigo Début de Journée
          </h1>
          <p className="text-slate-400 mt-1">Enregistrez les sorties matinales de produits du frigo pour la vente du jour.</p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-rose-500 hover:bg-rose-450 text-white rounded-2xl font-bold shadow-lg shadow-rose-950/20 cursor-pointer text-xs transition-colors"
        >
          <Plus size={18} />
          <span>Déclarer une Sortie</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Search Input */}
        <div className="relative lg:col-span-6">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher une sortie (Produit, employé, raison...)"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Date Du */}
        <div className="flex items-center space-x-2 lg:col-span-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Du</span>
          <input
            type="date"
            value={startDateFilter}
            onChange={e => setStartDateFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Date Au */}
        <div className="flex items-center space-x-2 lg:col-span-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Au</span>
          <input
            type="date"
            value={endDateFilter}
            onChange={e => setEndDateFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Reset button */}
        {(startDateFilter || endDateFilter) && (
          <button
            onClick={() => {
              setStartDateFilter('');
              setEndDateFilter('');
            }}
            className="lg:col-span-2 py-2 bg-slate-850 hover:bg-slate-800 text-rose-400 hover:text-rose-450 border border-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors text-center"
          >
            Reset
          </button>
        )}
      </div>

      {/* Sum Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Valeur Initiale des Sorties Frigo</span>
          <p className="text-xl font-black text-rose-450 mt-1">{formatFCFA(totalSortiesValue)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total des Ventes Clôturées</span>
          <p className="text-xl font-black text-emerald-450 mt-1">{formatFCFA(totalSalesValue)}</p>
        </div>
      </div>

      {/* Batch delete action bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500/10 border border-rose-900/40 p-4 rounded-2xl flex items-center justify-between text-xs text-rose-450 backdrop-blur-md mb-4"
          >
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-rose-450">{selectedIds.length}</span>
              <span className="text-slate-455 font-medium">sortie(s) de stock sélectionnée(s) pour suppression</span>
            </div>
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-455 text-white font-extrabold rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              Supprimer la sélection
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden animate-fadeIn">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-4 px-6 w-10">
                  <input
                    type="checkbox"
                    checked={filteredOutputs.length > 0 && selectedIds.length === filteredOutputs.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-850 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="py-4 px-6">Date & Heure</th>
                <th className="py-4 px-6">Produit</th>
                <th className="py-4 px-6 text-center">Statut</th>
                <th className="py-4 px-6 text-right">Qté Sortie</th>
                <th className="py-4 px-6 text-right">Qté Restante</th>
                <th className="py-4 px-6 text-right">Qté Vendue</th>
                <th className="py-4 px-6 text-right">Valeur Vente</th>
                <th className="py-4 px-6">Employé</th>
                <th className="py-4 px-6">Notes / Raison</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-350">
              {filteredOutputs.length > 0 ? (
                filteredOutputs.map(out => (
                  <tr key={out.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 px-6 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(out.id)}
                        onChange={() => handleSelectRow(out.id)}
                        className="rounded border-slate-850 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer h-4 w-4"
                      />
                    </td>
                    <td className="py-4 px-6 text-slate-550">
                      {formatDate(out.createdAt)} · <span className="text-[10px]">{formatTime(out.createdAt)}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-white">{out.productName}</td>
                    <td className="py-4 px-6 text-center">
                      {out.status === 'en_cours' ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase bg-amber-500/10 text-amber-400 border border-amber-500/10 animate-pulse">
                          En cours
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" title={`Payé par ${out.paymentMethod}`}>
                          Validé ({out.paymentMethod})
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-slate-350">{out.quantity}</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-450">
                      {out.status === 'valide' ? out.remainingQuantity : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-slate-300">
                      {out.status === 'valide' ? out.soldQuantity : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-emerald-400">
                      {out.status === 'valide' ? formatFCFA(out.totalAmount) : '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-450 font-medium">{out.employeeName}</td>
                    <td className="py-4 px-6 italic text-slate-500 font-light truncate max-w-xs">{out.notes || '-'}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        {out.status === 'en_cours' && (
                          <button
                            onClick={() => handleOpenValidateModal(out)}
                            className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                            title="Clôturer la journée de vente"
                          >
                            Clôturer
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(out)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(out.id)}
                          className="p-1.5 bg-rose-955/20 hover:bg-rose-900/40 text-rose-455 rounded-lg transition-colors cursor-pointer"
                          title="Annuler et réajuster stock"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-35 text-slate-400" />
                    <span>Aucune sortie de stock correspondant aux filtres.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Output Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
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
                  <Sparkles className="text-rose-455 mr-2 h-5 w-5" />
                  {editingOutput ? 'Modifier la Perte' : 'Déclarer une Sortie'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-white"
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
                {/* Select Product */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sélectionner un Produit</label>
                  <select
                    disabled={!!editingOutput}
                    value={productId}
                    onChange={e => setProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500 cursor-pointer disabled:opacity-60"
                  >
                    <option value="" disabled>-- Choisir un produit --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.quantity <= 0 && (!editingOutput || editingOutput.productId !== p.id)}>
                        {p.name} ({p.id === productId ? displayAvailableQty : p.quantity} disponibles - {formatFCFA(p.unitPrice)} / unitaire)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valeur financière */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Valeur financière de la sortie (FCFA)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={totalValue || ''}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setTotalValue(val);
                      if (selectedProduct) {
                        setQuantity(val / selectedProduct.unitPrice);
                      }
                    }}
                    placeholder="Ex: 10000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Display calculated pieces */}
                {selectedProduct && totalValue > 0 && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1 text-xs text-slate-400">
                    <p>Prix unitaire : <span className="text-white font-bold">{formatFCFA(selectedProduct.unitPrice)}</span></p>
                    <p>Quantité calculée : <span className="text-rose-455 font-extrabold text-sm">{quantity.toFixed(2)} pièces</span></p>
                    <span className="text-[10px] text-slate-500 block">
                      Stock maximum disponible : {displayAvailableQty} pièces
                    </span>
                  </div>
                )}

                {/* Reason / Notes */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Raison / Notes de Sortie <span className="text-slate-500 normal-case font-normal">(Facultatif)</span></label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ex: Viande de boeuf avariée suite à coupure d'électricité."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                {/* Sélectionner l'Employé */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Employé concerné</label>
                  <select
                    value={employeeName}
                    onChange={e => setEmployeeName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Choisir un employé --</option>
                    {employeeCandidates.map(name => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date de sortie */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date de la Sortie</label>
                  <input
                    type="date"
                    required
                    value={sortieDate}
                    onChange={e => setSortieDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 py-3 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 bg-rose-500 hover:bg-rose-455 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    {editingOutput ? 'Modifier' : 'Valider la Sortie'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Validation / Clôture Modal */}
      <AnimatePresence>
        {isValidatingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsValidatingModalOpen(false)}
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
                  <Sparkles className="text-emerald-450 mr-2 h-5 w-5" />
                  Clôturer et Saisir le Restant
                </h3>
                <button
                  onClick={() => setIsValidatingModalOpen(false)}
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

              {validatingOutput && (
                <form onSubmit={handleSaveValidation} className="space-y-4 mt-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs text-slate-400">
                    <p>Produit : <span className="text-white font-bold">{validatingOutput.productName}</span></p>
                    <p>Quantité initialement sortie : <span className="text-white font-bold">{validatingOutput.quantity} pièces</span></p>
                    <p>Prix unitaire : <span className="text-white font-bold">{formatFCFA(validatingOutput.unitPrice)}</span></p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quantité Restante (Retournée au Frigo)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={validatingOutput.quantity}
                      value={remainingQty}
                      onChange={e => setRemainingQty(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 2"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Cette quantité sera **rajoutée** à votre stock au frigo en fin de journée.
                    </span>
                  </div>

                  {remainingQty !== '' && remainingQty <= validatingOutput.quantity && (
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                      <span className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">Quantité vendue (calculée)</span>
                      <span className="font-extrabold text-emerald-400">{validatingOutput.quantity - remainingQty} pièces</span>
                    </div>
                  )}

                  {remainingQty !== '' && remainingQty <= validatingOutput.quantity && (
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                      <span className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">Chiffre d'affaires estimé</span>
                      <span className="font-extrabold text-emerald-450">{formatFCFA((validatingOutput.quantity - remainingQty) * validatingOutput.unitPrice)}</span>
                    </div>
                  )}

                  {/* Mode de Paiement */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mode de Paiement des Ventes</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Espèces">Espèces</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Carte">Carte</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsValidatingModalOpen(false)}
                      className="w-1/2 py-3 bg-slate-850 hover:bg-slate-850/80 text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-955 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Valider et Clôturer
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Output Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Annuler la sortie de stock"
        message="Voulez-vous vraiment annuler cette sortie de stock ? Les pièces déclarées perdues ou vendues seront réajustées dans votre inventaire actuel du frigo et les ventes correspondantes seront annulées."
        type="danger"
        confirmText="Annuler la sortie"
        cancelText="Conserver"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsConfirmOpen(false); setOutputToDeleteId(null); }}
      />

      {/* Delete Selection Confirmation */}
      <ConfirmDialog
        isOpen={isBatchConfirmOpen}
        title="Annuler les sorties sélectionnées"
        message={`Voulez-vous vraiment annuler les ${selectedIds.length} sorties de stock sélectionnées ? Les pièces correspondantes seront restituées au frigo et les ventes déjà validées seront également annulées.`}
        type="danger"
        confirmText="Annuler les sorties"
        cancelText="Conserver"
        onConfirm={handleConfirmDeleteSelected}
        onCancel={() => setIsBatchConfirmOpen(false)}
      />
    </div>
  );
}

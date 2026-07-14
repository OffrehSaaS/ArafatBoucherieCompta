'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Product, StockRestant } from '@/lib/db/store';
import { formatFCFA, formatDate, formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  TrendingDown,
  Printer,
  Plus,
  Search,
  X,
  Sparkles,
  Info,
  Trash2,
  Edit
} from 'lucide-react';

export default function StockRestantPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockRestants, setStockRestants] = useState<StockRestant[]>([]);

  // Search/Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestant, setEditingRestant] = useState<StockRestant | null>(null);

  // Form State
  const [productId, setProductId] = useState('');
  const [totalValue, setTotalValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Espèces' | 'Mobile Money' | 'Carte' | 'Autre'>('Espèces');
  const [recordedDate, setRecordedDate] = useState('');
  const [error, setError] = useState('');

  // Confirm delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [restantToDeleteId, setRestantToDeleteId] = useState<string | null>(null);

  // Batch delete states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(LocalDbStore.getProducts());
    setStockRestants(LocalDbStore.getStockRestants().sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
    setSelectedIds([]);
  };

  const handleOpenModal = () => {
    const prods = LocalDbStore.getProducts();
    setProducts(prods);
    setEditingRestant(null);
    if (prods.length > 0) {
      setProductId(prods[0].id);
    } else {
      setProductId('');
    }
    setTotalValue(0);
    setPaymentMethod('Espèces');
    setRecordedDate(new Date().toISOString().split('T')[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (entry: StockRestant) => {
    const prods = LocalDbStore.getProducts();
    setProducts(prods);
    setEditingRestant(entry);
    setProductId(entry.productId);
    setTotalValue(entry.totalValue);
    setPaymentMethod(entry.paymentMethod);
    setRecordedDate(entry.createdAt.split('T')[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!productId) {
      setError('Veuillez sélectionner un produit.');
      return;
    }
    if (totalValue <= 0) {
      setError('Veuillez entrer un montant supérieur à 0 FCFA.');
      return;
    }

    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) {
      setError('Produit introuvable.');
      return;
    }

    try {
      const payload = {
        productId,
        totalValue,
        paymentMethod,
        recordedBy: user?.fullName || 'Utilisateur',
        createdAt: recordedDate ? new Date(recordedDate + 'T18:00:00Z').toISOString() : new Date().toISOString()
      };

      if (editingRestant) {
        LocalDbStore.updateStockRestant(editingRestant.id, payload, user?.fullName || 'Utilisateur');
      } else {
        LocalDbStore.addStockRestant(payload, user?.fullName || 'Utilisateur');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  const handleDeleteClick = (id: string) => {
    setRestantToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (restantToDeleteId) {
      try {
        LocalDbStore.deleteStockRestant(restantToDeleteId, user?.fullName || 'Utilisateur');
        setIsConfirmOpen(false);
        setRestantToDeleteId(null);
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRestants.map(r => r.id));
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
        LocalDbStore.deleteStockRestant(id, userName);
      }
      setSelectedIds([]);
      setIsBatchConfirmOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter stock restants
  const filteredRestants = stockRestants.filter(r => {
    const itemDate = r.createdAt.split('T')[0];
    const matchStart = !startDateFilter || itemDate >= startDateFilter;
    const matchEnd = !endDateFilter || itemDate <= endDateFilter;
    const matchesSearch = r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStart && matchEnd && matchesSearch;
  });

  const totalValueSum = filteredRestants.reduce((acc, r) => acc + r.totalValue, 0);
  const totalQtySum = filteredRestants.reduce((acc, r) => acc + r.quantity, 0);

  const selectedProduct = products.find(p => p.id === productId);
  const computedPieces = selectedProduct && totalValue > 0 ? (totalValue / selectedProduct.unitPrice) : 0;

  return (
    <div className="space-y-6 select-none print:bg-white print:text-black">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <TrendingDown className="text-emerald-400 mr-2 h-8 w-8" />
            Stock Restant Fin de Journée
          </h1>
          <p className="text-slate-400 mt-1">
            Enregistrez la marchandise restante en fin de journée et calculez automatiquement les ventes correspondantes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl font-bold cursor-pointer transition-colors text-xs"
          >
            <Printer size={18} />
            <span>Imprimer</span>
          </button>
          
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold shadow-lg shadow-emerald-500/10 cursor-pointer text-xs transition-colors"
          >
            <Plus size={18} />
            <span>Saisir Stock Restant</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex items-start space-x-3 print:hidden">
        <Info className="text-emerald-400 h-5 w-5 mt-0.5 shrink-0" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-300">Retour Automatique & Calcul de Ventes</p>
          <p className="text-slate-400 font-light leading-relaxed">
            La saisie du stock restant rajoute automatiquement la marchandise calculée dans le **Stock au Frigo**. Le système fait également la différence avec les sorties du matin pour générer automatiquement la vente correspondante dans le registre.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl print:border print:bg-white">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Valorisation Totale Restante</span>
          <h2 className="text-2xl font-black text-emerald-400 mt-1 print:text-black">{formatFCFA(totalValueSum)}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl print:border print:bg-white">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Pièces Restantes (Calculées)</span>
          <h2 className="text-2xl font-black text-white mt-1 print:text-black">{totalQtySum.toFixed(2)} pièces</h2>
        </div>
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl print:border print:bg-white">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Nombre d'enregistrements</span>
          <h2 className="text-2xl font-black text-indigo-400 mt-1 print:text-black">{filteredRestants.length} entrées</h2>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center print:hidden">
        {/* Search */}
        <div className="relative lg:col-span-6">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par produit ou agent..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Date Du */}
        <div className="flex items-center space-x-2 lg:col-span-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Du</span>
          <input
            type="date"
            value={startDateFilter}
            onChange={e => setStartDateFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Date Au */}
        <div className="flex items-center space-x-2 lg:col-span-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Au</span>
          <input
            type="date"
            value={endDateFilter}
            onChange={e => setEndDateFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Reset button */}
        <div className="lg:col-span-2">
          {(startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-rose-455 hover:text-rose-450 border border-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors text-center"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Batch delete action bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500/10 border border-rose-900/40 p-4 rounded-2xl flex items-center justify-between text-xs text-rose-450 backdrop-blur-md mb-4 print:hidden"
          >
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-rose-450">{selectedIds.length}</span>
              <span className="text-slate-455 font-medium">saisie(s) de stock restant sélectionnée(s) pour suppression</span>
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
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden print:border print:bg-white print:text-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40 print:bg-gray-100 print:text-black print:border-b">
                <th className="py-4 px-6 w-10 print:hidden">
                  <input
                    type="checkbox"
                    checked={filteredRestants.length > 0 && selectedIds.length === filteredRestants.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-850 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="py-4 px-6">Date & Heure</th>
                <th className="py-4 px-6">Produit</th>
                <th className="py-4 px-6 text-right">Valeur Restante</th>
                <th className="py-4 px-6 text-right">Quantité (Calculée)</th>
                <th className="py-4 px-6 text-center">Paiement Vente</th>
                <th className="py-4 px-6">Enregistré Par</th>
                <th className="py-4 px-6 text-center print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-350 print:divide-y print:text-black">
              {filteredRestants.length > 0 ? (
                filteredRestants.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 px-6 w-10 print:hidden">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(entry.id)}
                        onChange={() => handleSelectRow(entry.id)}
                        className="rounded border-slate-850 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer h-4 w-4"
                      />
                    </td>
                    <td className="py-4 px-6 text-slate-555">
                      {formatDate(entry.createdAt)} · <span className="text-[10px]">{formatTime(entry.createdAt)}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-white print:text-black">{entry.productName}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-emerald-400 print:text-black">
                      {formatFCFA(entry.totalValue)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-350">
                      {entry.quantity.toFixed(2)} pièces
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {entry.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-455 font-medium">{entry.recordedBy}</td>
                    <td className="py-4 px-6 text-center print:hidden">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleEditClick(entry)}
                          className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Modifier la saisie"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(entry.id)}
                          className="p-1.5 bg-rose-955/20 hover:bg-rose-900/40 text-rose-455 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer la saisie et annuler le retour/la vente"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Aucun stock restant fin de journée enregistré pour cette plage de dates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saisir Stock Restant Modal */}
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                <h3 className="text-lg font-extrabold text-white flex items-center">
                  <Sparkles className="text-emerald-450 mr-2 h-5 w-5" />
                  {editingRestant ? 'Modifier le Stock Restant' : 'Saisir le Stock Restant'}
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

              <form onSubmit={handleSave} className="space-y-4 mt-4">
                {/* Select Product */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sélectionner un Produit</label>
                  <select
                    value={productId}
                    onChange={e => setProductId(e.target.value)}
                    disabled={!!editingRestant}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatFCFA(p.unitPrice)} / unitaire)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price total restant */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Valeur / Prix Total du Restant (FCFA)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={totalValue || ''}
                    onChange={e => setTotalValue(Number(e.target.value))}
                    placeholder="Ex: 35000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Computed Quantity display */}
                {selectedProduct && totalValue > 0 && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs text-slate-400">
                    <p>Prix unitaire du produit : <span className="text-white font-bold">{formatFCFA(selectedProduct.unitPrice)}</span></p>
                    <p>Quantité calculée : <span className="text-emerald-400 font-extrabold text-sm">{computedPieces.toFixed(2)} pièces</span></p>
                    <span className="text-[10px] text-slate-500 block leading-relaxed">
                      Cette quantité sera **rajoutée** à votre stock au frigo et servira à calculer automatiquement la vente du jour par différence avec les sorties déclarées.
                    </span>
                  </div>
                )}

                {/* Payment Method for sales */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mode de Paiement pour la vente automatique</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money (Wave, OM, etc.)</option>
                    <option value="Carte">Carte Bancaire</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date d'Enregistrement</label>
                  <input
                    type="date"
                    required
                    value={recordedDate}
                    onChange={e => setRecordedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 py-3 bg-slate-850 hover:bg-slate-800 text-slate-455 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    {editingRestant ? 'Modifier le Restant' : 'Enregistrer le Restant'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Supprimer la saisie de stock restant"
        message="Voulez-vous vraiment supprimer cet enregistrement de stock restant ? Cela annulera également la vente générée automatiquement et retirera la quantité correspondante du frigo."
        type="danger"
        confirmText="Confirmer la suppression"
        cancelText="Conserver"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsConfirmOpen(false); setRestantToDeleteId(null); }}
      />

      {/* Delete Selection Confirmation */}
      <ConfirmDialog
        isOpen={isBatchConfirmOpen}
        title="Supprimer les saisies sélectionnées"
        message={`Voulez-vous vraiment supprimer les ${selectedIds.length} enregistrements de stock restant sélectionnés ? Cela annulera également les ventes générées automatiquement et retirera les quantités correspondantes du frigo.`}
        type="danger"
        confirmText="Supprimer les saisies"
        cancelText="Conserver"
        onConfirm={handleConfirmDeleteSelected}
        onCancel={() => setIsBatchConfirmOpen(false)}
      />
    </div>
  );
}

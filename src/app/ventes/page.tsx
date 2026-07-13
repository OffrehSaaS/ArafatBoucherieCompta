'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Product, Sale } from '@/lib/db/store';
import { formatFCFA, formatDate, formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  X,
  Sparkles,
  Info,
  CreditCard,
  PhoneCall,
  DollarSign,
  Edit,
  Trash2
} from 'lucide-react';

export default function VentesPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Confirm delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [saleToDeleteId, setSaleToDeleteId] = useState<string | null>(null);

  // Form State
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Espèces' | 'Mobile Money' | 'Carte' | 'Autre'>('Espèces');
  const [saleDate, setSaleDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(LocalDbStore.getProducts());
    setSales(LocalDbStore.getSales().sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
  };

  const handleOpenModal = () => {
    const prods = LocalDbStore.getProducts();
    const availableProds = prods.filter(p => p.quantity > 0);
    setProducts(prods);
    setEditingSale(null);
    
    if (availableProds.length > 0) {
      setProductId(availableProds[0].id);
      setUnitPrice(availableProds[0].unitPrice);
    } else {
      setProductId('');
      setUnitPrice(0);
    }
    setQuantity(0);
    setPaymentMethod('Espèces');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (sale: Sale) => {
    const prods = LocalDbStore.getProducts();
    setProducts(prods);
    setEditingSale(sale);
    setProductId(sale.productId);
    setQuantity(sale.quantity);
    setUnitPrice(sale.unitPrice);
    setPaymentMethod(sale.paymentMethod);
    setSaleDate(sale.createdAt.split('T')[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSaleToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (saleToDeleteId) {
      try {
        LocalDbStore.deleteSale(saleToDeleteId, user?.fullName || 'Vendeur');
        setIsConfirmOpen(false);
        setSaleToDeleteId(null);
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleProductChange = (prodId: string) => {
    setProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setUnitPrice(prod.unitPrice);
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
    if (unitPrice <= 0) {
      setError('Le prix unitaire doit être supérieur à 0.');
      return;
    }

    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) {
      setError('Produit introuvable.');
      return;
    }

    // Direct sale stock checking
    if (!editingSale || !editingSale.sourceSortieId) {
      // Revert editingSale original quantity to check stock properly if we are modifying
      const currentAvailable = selectedProduct.quantity + (editingSale && editingSale.productId === productId ? editingSale.quantity : 0);
      if (currentAvailable < quantity) {
        setError(`Stock insuffisant. Quantité disponible : ${currentAvailable} pcs.`);
        return;
      }
    }

    try {
      const payload = {
        productId,
        quantity,
        unitPrice,
        paymentMethod,
        sellerName: editingSale ? editingSale.sellerName : (user?.fullName || 'Vendeur'),
        createdAt: saleDate ? new Date(saleDate + 'T12:00:00Z').toISOString() : undefined
      };

      if (editingSale) {
        LocalDbStore.updateSale(editingSale.id, payload, user?.fullName || 'Vendeur');
      } else {
        LocalDbStore.addSale(payload, user?.fullName || 'Vendeur');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  // Filter sales
  const filteredSales = sales.filter(s => {
    const itemDate = s.createdAt.split('T')[0];
    const matchStart = !startDateFilter || itemDate >= startDateFilter;
    const matchEnd = !endDateFilter || itemDate <= endDateFilter;
    const matchesSearch = s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStart && matchEnd && matchesSearch;
  });

  const selectedProduct = products.find(p => p.id === productId);
  const totalSalesVal = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <ShoppingCart className="text-emerald-450 mr-2 h-8 w-8" />
            Ventes Enregistrées
          </h1>
          <p className="text-slate-400 mt-1">Enregistrez les ventes journalières et suivez les flux d'encaissement.</p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          <Plus size={18} />
          <span>Nouvelle Vente</span>
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
            placeholder="Rechercher une vente (Produit, vendeur, mode...)"
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
        {(startDateFilter || endDateFilter) && (
          <button
            onClick={() => {
              setStartDateFilter('');
              setEndDateFilter('');
            }}
            className="lg:col-span-2 py-2 bg-slate-850 hover:bg-slate-800 text-rose-455 hover:text-rose-350 border border-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors text-center"
          >
            Reset
          </button>
        )}
      </div>

      {/* Payment methods break down */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Espèces', 'Mobile Money', 'Carte', 'Autre'].map(method => {
          const amt = filteredSales.filter(s => s.paymentMethod === method).reduce((acc, s) => acc + s.totalAmount, 0);
          return (
            <div key={method} className="bg-slate-900/60 border border-slate-850 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{method}</p>
                <p className="text-md font-black text-white mt-0.5">{formatFCFA(amt)}</p>
              </div>
              <div className="p-2 bg-slate-850 rounded-xl text-slate-400">
                {method === 'Espèces' ? <DollarSign size={16} /> :
                 method === 'Mobile Money' ? <PhoneCall size={16} /> :
                 <CreditCard size={16} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-4 px-6">Date & Heure</th>
                <th className="py-4 px-6">Produit</th>
                <th className="py-4 px-6 text-right">Prix Unitaire</th>
                <th className="py-4 px-6 text-right">Quantité</th>
                <th className="py-4 px-6 text-right">Total Montant</th>
                <th className="py-4 px-6">Paiement</th>
                <th className="py-4 px-6">Vendeur</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-350">
              {filteredSales.length > 0 ? (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 px-6 text-slate-550">
                      {formatDate(sale.createdAt)} · <span className="text-[10px]">{formatTime(sale.createdAt)}</span>
                    </td>
                    <td className="py-4 px-6 text-white font-medium">
                      <span className="font-bold block">{sale.productName}</span>
                      {sale.sourceSortieId && (
                        <span className="text-[9px] font-bold text-emerald-450 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 inline-block mt-0.5">
                          Généré via Sortie
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-300">{formatFCFA(sale.unitPrice)}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-slate-350">{sale.quantity}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-emerald-450">
                      {formatFCFA(sale.totalAmount)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded font-bold text-[9px] uppercase ${
                        sale.paymentMethod === 'Espèces' ? 'bg-emerald-500/10 text-emerald-400' :
                        sale.paymentMethod === 'Mobile Money' ? 'bg-amber-500/10 text-amber-400' :
                        sale.paymentMethod === 'Carte' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{sale.sellerName}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleEditClick(sale)}
                          className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Modifier la vente"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(sale.id)}
                          className="p-1.5 bg-rose-955/20 hover:bg-rose-900/40 text-rose-455 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer la vente"
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
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-35 text-slate-400" />
                    <span>Aucune vente enregistrée.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Sale Modal */}
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
                  <Sparkles className="text-emerald-450 mr-2 h-5 w-5" />
                  {editingSale ? 'Modifier la Vente' : 'Nouvelle Vente'}
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
                {/* Select Product */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sélectionner un Produit</label>
                  <select
                    value={productId}
                    onChange={e => handleProductChange(e.target.value)}
                    disabled={!!editingSale}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>-- Choisir un produit --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.quantity} disponibles - {formatFCFA(p.unitPrice)} / unitaire)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price and quantity inputs in row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Unit Price */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prix Unitaire (FCFA)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={unitPrice || ''}
                      onChange={e => setUnitPrice(Number(e.target.value))}
                      placeholder="Ex: 3500"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  {/* Quantity */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quantité Vendue (pièces)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantity || ''}
                      onChange={e => setQuantity(Number(e.target.value))}
                      placeholder="Ex: 5"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {selectedProduct && (
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Stock disponible au frigo : <span className="font-bold text-emerald-450">{selectedProduct.quantity} pièces</span>
                  </span>
                )}

                {/* Mode of Payment */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mode de Paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money (Orange Money, Wave, etc.)</option>
                    <option value="Carte">Carte Bancaire</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date de la Vente</label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Total Calculated Sale Amount */}
                {unitPrice > 0 && quantity > 0 && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                    <span className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">Montant à encaisser</span>
                    <span className="font-extrabold text-emerald-400">{formatFCFA(quantity * unitPrice)}</span>
                  </div>
                )}

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
                    className="w-1/2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    {editingSale ? 'Modifier la Vente' : 'Enregistrer Vente'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Supprimer la vente"
        message="Voulez-vous vraiment supprimer cette vente ? Si elle n'a pas été générée via une sortie, la quantité vendue sera rajoutée au stock au frigo."
        type="danger"
        confirmText="Supprimer"
        cancelText="Conserver"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsConfirmOpen(false); setSaleToDeleteId(null); }}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Product, Supplier, StockHistory } from '@/lib/db/store';
import { formatFCFA, formatDate, formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  Plus, 
  Edit3, 
  Trash2,
  History, 
  Inbox, 
  Search, 
  SlidersHorizontal,
  X,
  Sparkles,
  Info,
  PackagePlus,
  Tag,
  BookOpen,
  ArrowDownLeft,
  Settings
} from 'lucide-react';

type TabType = 'current' | 'history' | 'catalog' | 'categories';

export default function StockPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<TabType>('current');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Incoming Stock Modal States
  const [isIncomingModalOpen, setIsIncomingModalOpen] = useState(false);
  const [incomingProductId, setIncomingProductId] = useState('');
  const [incomingQty, setIncomingQty] = useState<number>(0);
  const [incomingSupplierId, setIncomingSupplierId] = useState('');
  const [incomingNotes, setIncomingNotes] = useState('');
  const [incomingDate, setIncomingDate] = useState('');

  // Delete product Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  // Delete Category Dialog States
  const [isDeleteCatDialogOpen, setIsDeleteCatDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Categories Form States
  const [newCatName, setNewCatName] = useState('');
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [renameCatValue, setRenameCatValue] = useState('');

  // Product Form States
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [supplierId, setSupplierId] = useState('');
  const [observations, setObservations] = useState('');
  const [productDate, setProductDate] = useState('');

  // Helper functions for bi-directional calculations
  const updateUnitPrice = (val: number) => {
    setUnitPrice(val);
    if (val > 0 && totalValue > 0) {
      setQuantity(Math.round(totalValue / val));
    } else if (val > 0 && quantity > 0) {
      setTotalValue(quantity * val);
    }
  };

  const updateQuantity = (val: number) => {
    setQuantity(val);
    if (unitPrice > 0) {
      setTotalValue(val * unitPrice);
    }
  };

  const updateTotalValue = (val: number) => {
    setTotalValue(val);
    if (unitPrice > 0) {
      setQuantity(Math.round(val / unitPrice));
    }
  };

  // Date Filters
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const prods = LocalDbStore.getProducts();
    const sups = LocalDbStore.getSuppliers();
    const hist = LocalDbStore.getStockHistory().sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    const cats = LocalDbStore.getCategories();
    
    setProducts(prods);
    setSuppliers(sups);
    setHistory(hist);
    setCategories(cats);

    if (cats.length > 0) {
      setCategory(cats[0]);
    }
    if (sups.length > 0) {
      setSupplierId(sups[0].id);
    }
  };

  // 1. OPEN PRODUCT MODAL (Add/Edit)
  const openAddModal = () => {
    if (!isAdmin) return;
    setEditingProduct(null);
    setName('');
    if (categories.length > 0) {
      setCategory(categories[0]);
    }
    setUnitPrice(0);
    setQuantity(0);
    setTotalValue(0);
    if (suppliers.length > 0) {
      setSupplierId(suppliers[0].id);
    }
    setObservations('');
    setProductDate(new Date().toISOString().split('T')[0]);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    if (!isAdmin) return;
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setUnitPrice(product.unitPrice);
    setQuantity(product.quantity);
    setTotalValue(product.quantity * product.unitPrice);
    setSupplierId(product.supplierId);
    setObservations(product.observations);
    setProductDate(product.createdAt ? product.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    setError('');
    setIsModalOpen(true);
  };

  // 2. SAVE PRODUCT TEMPLATE
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Le nom du produit est obligatoire.');
      return;
    }
    if (unitPrice <= 0) {
      setError('Le prix unitaire doit être supérieur à 0 FCFA.');
      return;
    }
    if (quantity < 0) {
      setError('La quantité ne peut pas être négative.');
      return;
    }
    if (!supplierId) {
      setError('Veuillez sélectionner un fournisseur.');
      return;
    }

    const payload = {
      name,
      category,
      unitPrice,
      quantity,
      supplierId,
      observations,
      createdAt: productDate ? new Date(productDate + 'T12:00:00Z').toISOString() : undefined
    };

    const userName = user?.fullName || 'Utilisateur';

    try {
      if (editingProduct) {
        LocalDbStore.updateProduct(editingProduct.id, payload, userName);
      } else {
        LocalDbStore.addProduct(payload, userName);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  // 3. INCOMING STOCK MODAL (Seller / Admin)
  const openIncomingModal = () => {
    const activeProds = products;
    if (activeProds.length > 0) {
      setIncomingProductId(activeProds[0].id);
    } else {
      setIncomingProductId('');
    }
    setIncomingQty(0);
    if (suppliers.length > 0) {
      setIncomingSupplierId(suppliers[0].id);
    }
    setIncomingNotes('');
    setIncomingDate(new Date().toISOString().split('T')[0]);
    setError('');
    setIsIncomingModalOpen(true);
  };

  const handleSaveIncoming = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!incomingProductId) {
      setError('Sélectionnez un produit.');
      return;
    }
    if (incomingQty <= 0) {
      setError('La quantité doit être supérieure à 0.');
      return;
    }
    if (!incomingSupplierId) {
      setError('Veuillez sélectionner un fournisseur.');
      return;
    }

    try {
      LocalDbStore.addStockIncoming(
        incomingProductId,
        incomingQty,
        incomingSupplierId,
        incomingNotes,
        user?.fullName || 'Utilisateur',
        incomingDate ? new Date(incomingDate + 'T12:00:00Z').toISOString() : undefined
      );
      setIsIncomingModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  // 4. SOFT DELETE PRODUCT
  const triggerDeleteProduct = (id: string) => {
    setProductToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteProduct = () => {
    if (productToDeleteId) {
      LocalDbStore.deleteProduct(productToDeleteId, user?.fullName || 'Administrateur');
      setIsDeleteDialogOpen(false);
      setProductToDeleteId(null);
      loadData();
    }
  };

  // 5. CATEGORIES ACTIONS
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newCatName.trim()) return;

    try {
      LocalDbStore.addCategory(newCatName.trim(), user?.fullName || 'Administrateur');
      setNewCatName('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout.');
    }
  };

  const handleStartRenameCat = (cat: string) => {
    setEditingCatName(cat);
    setRenameCatValue(cat);
  };

  const handleSaveRenameCat = (oldName: string) => {
    setError('');
    if (!renameCatValue.trim()) return;
    try {
      LocalDbStore.updateCategory(oldName, renameCatValue.trim(), user?.fullName || 'Administrateur');
      setEditingCatName(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification.');
    }
  };

  const triggerDeleteCategory = (cat: string) => {
    setCategoryToDelete(cat);
    setIsDeleteCatDialogOpen(true);
  };

  const handleConfirmDeleteCat = () => {
    if (categoryToDelete) {
      LocalDbStore.deleteCategory(categoryToDelete, user?.fullName || 'Administrateur');
      setIsDeleteCatDialogOpen(false);
      setCategoryToDelete(null);
      loadData();
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredHistory = history.filter(h => {
    const itemDate = h.createdAt.split('T')[0];
    const matchStart = !startDateFilter || itemDate >= startDateFilter;
    const matchEnd = !endDateFilter || itemDate <= endDateFilter;
    return matchStart && matchEnd;
  });

  const totalStockVal = filteredProducts.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <Inbox className="text-emerald-450 mr-2 h-8 w-8" />
            Stock au Frigo
          </h1>
          <p className="text-slate-400 mt-1">Gérez le catalogue des viandes et enregistrez les livraisons de stock.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* Incoming Stock button - available to Sellers too */}
          <button
            onClick={openIncomingModal}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-350 rounded-2xl font-bold cursor-pointer transition-colors"
          >
            <PackagePlus size={18} />
            <span>Arrivage Stock (Entrée)</span>
          </button>

          {/* New product button - admin only */}
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <Plus size={18} />
              <span>Nouveau Produit</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs list (Admin sees 4, seller sees 2) */}
      <div className="flex border-b border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('current')}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center space-x-2 ${
            activeTab === 'current'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          <Inbox size={15} />
          <span>Stock au Frigo</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          <History size={15} />
          <span>Historique des Flux</span>
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center space-x-2 ${
                activeTab === 'catalog'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              <BookOpen size={15} />
              <span>Catalogue Produits</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center space-x-2 ${
                activeTab === 'categories'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              <Tag size={15} />
              <span>Catégories</span>
            </button>
          </>
        )}
      </div>

      {/* -------------------- TAB 1: STOCK ACTUEL -------------------- */}
      {activeTab === 'current' && (
        <>
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher un produit (Nom, catégorie...)"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Category Select Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <SlidersHorizontal size={16} />
              </span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="All">Toutes catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sum Card */}
            <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Valeur du Stock Filtré</span>
              <p className="text-md font-black text-emerald-400 mt-0.5">{formatFCFA(totalStockVal)}</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-4 px-6">Produit</th>
                    <th className="py-4 px-6">Catégorie</th>
                    <th className="py-4 px-6 text-right">Prix Unitaire</th>
                    <th className="py-4 px-6 text-right">Quantité (pièces)</th>
                    <th className="py-4 px-6 text-right">Valeur Totale</th>
                    <th className="py-4 px-6">Fournisseur</th>
                    <th className="py-4 px-6">Observations</th>
                    {isAdmin && <th className="py-4 px-6 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-350">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(prod => (
                      <tr key={prod.id} className="hover:bg-slate-850/30 transition-colors">
                        <td className="py-4 px-6 font-bold text-white">{prod.name}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full bg-slate-950 text-slate-400 font-medium">
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-slate-300">{formatFCFA(prod.unitPrice)}</td>
                        <td className="py-4 px-6 text-right">
                          <span className={`font-extrabold px-2 py-0.5 rounded ${
                            prod.quantity < 30 ? 'text-amber-500 bg-amber-500/10' : 'text-slate-300'
                          }`}>
                            {prod.quantity}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-emerald-400">
                          {formatFCFA(prod.quantity * prod.unitPrice)}
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-medium">{prod.supplierName}</td>
                        <td className="py-4 px-6 italic text-slate-500 font-light truncate max-w-xs">{prod.observations || '-'}</td>
                        {isAdmin && (
                          <td className="py-4 px-6 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => openEditModal(prod)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-450 rounded-lg transition-colors cursor-pointer"
                                title="Modifier Stock Initial / Prix"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => triggerDeleteProduct(prod.id)}
                                className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer du catalogue"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-slate-500">
                        <Inbox className="h-12 w-12 mx-auto mb-2 opacity-30 text-slate-400" />
                        <span>Aucun produit trouvé dans le stock.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* -------------------- TAB 2: HISTORIQUE DES FLUX -------------------- */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Date range filters */}
          <div className="flex flex-wrap gap-4 items-center bg-slate-900/40 p-4 border border-slate-850 rounded-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-450 font-bold uppercase">Du</span>
              <input
                type="date"
                value={startDateFilter}
                onChange={e => setStartDateFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-450 font-bold uppercase">Au</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={e => setEndDateFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            {(startDateFilter || endDateFilter) && (
              <button
                onClick={() => {
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="text-[10px] text-rose-400 hover:text-rose-350 font-bold uppercase tracking-wider bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20 cursor-pointer"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-4 px-6">Date & Heure</th>
                    <th className="py-4 px-6">Produit</th>
                    <th className="py-4 px-6">Opération</th>
                    <th className="py-4 px-6 text-right">Variation</th>
                    <th className="py-4 px-6 text-right">Stock Final</th>
                    <th className="py-4 px-6">Agent</th>
                    <th className="py-4 px-6">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-350">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-850/30 transition-colors">
                        <td className="py-4 px-6 text-slate-550">
                          {formatDate(item.createdAt)} · <span className="text-[10px]">{formatTime(item.createdAt)}</span>
                        </td>
                        <td className="py-4 px-6 font-bold text-white">{item.productName}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            item.changeType === 'Entrée' ? 'bg-emerald-500/10 text-emerald-400' :
                            item.changeType === 'Vente' ? 'bg-blue-500/10 text-blue-400' :
                            item.changeType === 'Sortie' ? 'bg-rose-500/10 text-rose-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {item.changeType}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-right font-extrabold ${
                          item.quantityChanged > 0 ? 'text-emerald-400' : 'text-rose-455'
                        }`}>
                          {item.quantityChanged > 0 ? `+${item.quantityChanged}` : item.quantityChanged}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-slate-300">{item.quantityAfter}</td>
                        <td className="py-4 px-6 text-slate-400 font-medium">{item.userName}</td>
                        <td className="py-4 px-6 text-slate-400 font-light truncate max-w-xs">{item.notes}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <History className="h-12 w-12 mx-auto mb-2 opacity-30 text-slate-400" />
                        <span>Aucun historique correspondant aux filtres.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* -------------------- TAB 3: CATALOGUE PRODUITS (Admin only) -------------------- */}
      {activeTab === 'catalog' && isAdmin && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden animate-fadeIn">
          <div className="p-5 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Catalogue des Références Produits</h3>
            <span className="text-[10px] text-slate-500">{products.length} références actives</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="py-4 px-6">Nom</th>
                  <th className="py-4 px-6">Catégorie</th>
                  <th className="py-4 px-6 text-right">Prix Unitaire</th>
                  <th className="py-4 px-6">Fournisseur Habituel</th>
                  <th className="py-4 px-6">Observations</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-350">
                {products.length > 0 ? (
                  products.map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-850/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-white">{prod.name}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full bg-slate-950 text-slate-450 font-medium">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-300">{formatFCFA(prod.unitPrice)}</td>
                      <td className="py-4 px-6 text-slate-400 font-medium">{prod.supplierName}</td>
                      <td className="py-4 px-6 italic text-slate-500 font-light truncate max-w-xs">{prod.observations || '-'}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-450 rounded-lg transition-colors cursor-pointer"
                            title="Modifier fiche produit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => triggerDeleteProduct(prod.id)}
                            className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer du catalogue"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Aucun produit au catalogue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- TAB 4: CATEGORIES (Admin only) -------------------- */}
      {activeTab === 'categories' && isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start animate-fadeIn">
          {/* Add Category Form */}
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <Plus className="text-emerald-450 mr-1.5 h-4 w-4" />
              Créer une Catégorie
            </h3>
            {error && <p className="text-[10px] text-rose-455 font-bold">{error}</p>}
            <form onSubmit={handleAddCategory} className="space-y-3">
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Ex: Viande de Mouton"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Ajouter la Catégorie
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden md:col-span-2">
            <div className="p-4 border-b border-slate-800 bg-slate-950/20">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Catégories existantes ({categories.length})</h3>
            </div>
            <div className="divide-y divide-slate-800 text-xs text-slate-300">
              {categories.map(cat => {
                const isEditing = editingCatName === cat;

                return (
                  <div key={cat} className="flex justify-between items-center py-3.5 px-6 hover:bg-slate-850/20">
                    {isEditing ? (
                      <div className="flex items-center space-x-2 w-full max-w-md">
                        <input
                          type="text"
                          value={renameCatValue}
                          onChange={e => setRenameCatValue(e.target.value)}
                          className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveRenameCat(cat)}
                          className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded text-[10px]"
                        >
                          Sauver
                        </button>
                        <button
                          onClick={() => setEditingCatName(null)}
                          className="px-3 py-1 bg-slate-800 text-slate-400 rounded text-[10px]"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-350">{cat}</span>
                    )}

                    {!isEditing && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStartRenameCat(cat)}
                          className="p-1.5 hover:bg-slate-850 text-emerald-450 rounded-lg transition-colors cursor-pointer"
                          title="Renommer la catégorie"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => triggerDeleteCategory(cat)}
                          className="p-1.5 hover:bg-rose-955/20 text-rose-455 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer la catégorie"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- INCOMING STOCK MODAL (Entrée de stock) -------------------- */}
      <AnimatePresence>
        {isIncomingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsIncomingModalOpen(false)}
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
                  <ArrowDownLeft className="text-emerald-455 mr-2 h-5 w-5" />
                  Arrivage de Stock (Entrée)
                </h3>
                <button
                  onClick={() => setIsIncomingModalOpen(false)}
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

              <form onSubmit={handleSaveIncoming} className="space-y-4 mt-4">
                {/* Select Product */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sélectionner le Produit</label>
                  <select
                    value={incomingProductId}
                    onChange={e => setIncomingProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Choisir un produit --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Catégorie : {p.category})</option>
                    ))}
                  </select>
                </div>

                {/* Quantity & Supplier */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quantité Livrée (pièces)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={incomingQty || ''}
                      onChange={e => setIncomingQty(Number(e.target.value))}
                      placeholder="Ex: 50"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fournisseur</label>
                    <select
                      value={incomingSupplierId}
                      onChange={e => setIncomingSupplierId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date d'Arrivage</label>
                  <input
                    type="date"
                    required
                    value={incomingDate}
                    onChange={e => setIncomingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Observations (Notes de livraison)</label>
                  <textarea
                    value={incomingNotes}
                    onChange={e => setIncomingNotes(e.target.value)}
                    placeholder="Ex: Arrivage frais du matin, pesé à la livraison."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsIncomingModalOpen(false)}
                    className="w-1/2 py-3 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    Valider l'Entrée
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------- ADD/EDIT PRODUCT MODAL -------------------- */}
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
                  <Sparkles className="text-emerald-400 mr-2 h-5 w-5" />
                  {editingProduct ? 'Modifier le Produit' : 'Créer un Produit'}
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

              <form onSubmit={handleSaveProduct} className="space-y-4 mt-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nom du Produit</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Filet de Boeuf"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Catégorie</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fournisseur</label>
                    <select
                      value={supplierId}
                      onChange={e => setSupplierId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prix Unitaire (FCFA)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={unitPrice || ''}
                      onChange={e => updateUnitPrice(Number(e.target.value))}
                      placeholder="Ex: 3500"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Valeur Totale (FCFA)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={totalValue || ''}
                      onChange={e => updateTotalValue(Number(e.target.value))}
                      placeholder="Ex: 60000"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Stock Initial (pièces)</label>
                    <input
                      type="number"
                      required
                      disabled={!!editingProduct && !isAdmin} // admin can modify initial quantity directly, seller cannot
                      min={0}
                      value={quantity || ''}
                      onChange={e => updateQuantity(Number(e.target.value))}
                      placeholder="Ex: 100"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Observations <span className="text-slate-500 normal-case font-normal">(Facultatif)</span></label>
                  <textarea
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                    placeholder="Détails supplémentaires..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date d'Enregistrement</label>
                  <input
                    type="date"
                    required
                    value={productDate}
                    onChange={e => setProductDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 py-3 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Product Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Supprimer un Produit"
        message="Voulez-vous supprimer ce produit du catalogue ? Il ne sera plus proposé pour les ventes ou les approvisionnements, mais tout son historique comptable sera préservé."
        type="danger"
        confirmText="Supprimer"
        cancelText="Conserver"
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteCatDialogOpen}
        title="Supprimer la Catégorie"
        message={`Voulez-vous supprimer cette catégorie ? Tous les produits associés seront automatiquement transférés vers la catégorie "Divers".`}
        type="danger"
        confirmText="Supprimer la catégorie"
        cancelText="Conserver"
        onConfirm={handleConfirmDeleteCat}
        onCancel={() => setIsDeleteCatDialogOpen(false)}
      />
    </div>
  );
}

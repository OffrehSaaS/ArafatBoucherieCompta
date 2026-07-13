'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Expense } from '@/lib/db/store';
import { formatFCFA, formatDate, formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  Receipt, 
  Plus, 
  Search, 
  X,
  Sparkles,
  Info,
  SlidersHorizontal,
  Edit,
  Trash2
} from 'lucide-react';

export default function DepensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Search/Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Confirm delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  // Form State
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('Eau');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [error, setError] = useState('');

  const categories = [
    'Eau', 'Tomates', 'Cube', 'Maggi', 'Piment', 'Huile', 
    'Oignons', 'Charbon', 'Transport', 'Glace', 'Salaires', 'Divers'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setExpenses(LocalDbStore.getExpenses().sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
  };

  const handleOpenModal = () => {
    setEditingExpense(null);
    setAmount(0);
    setCategory('Eau');
    setDescription('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setAmount(expense.amount);
    setCategory(expense.category);
    setDescription(expense.description);
    setExpenseDate(expense.createdAt.split('T')[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setExpenseToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (expenseToDeleteId) {
      try {
        LocalDbStore.deleteExpense(expenseToDeleteId, user?.fullName || 'Utilisateur');
        setIsConfirmOpen(false);
        setExpenseToDeleteId(null);
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amount <= 0) {
      setError('Veuillez entrer un montant supérieur à 0 FCFA.');
      return;
    }
    if (!description.trim()) {
      setError('Veuillez fournir une brève description.');
      return;
    }

    try {
      const payload = {
        amount,
        category,
        description,
        recordedBy: editingExpense ? editingExpense.recordedBy : (user?.fullName || 'Utilisateur'),
        createdAt: expenseDate ? new Date(expenseDate + 'T12:00:00Z').toISOString() : undefined
      };

      if (editingExpense) {
        LocalDbStore.updateExpense(editingExpense.id, payload, user?.fullName || 'Utilisateur');
      } else {
        LocalDbStore.addExpense(payload, user?.fullName || 'Utilisateur');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(e => {
    const itemDate = e.createdAt.split('T')[0];
    const matchStart = !startDateFilter || itemDate >= startDateFilter;
    const matchEnd = !endDateFilter || itemDate <= endDateFilter;
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    return matchStart && matchEnd && matchesSearch && matchesCategory;
  });

  const totalExpensesVal = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <Receipt className="text-rose-455 mr-2 h-8 w-8" />
            Dépenses Opérationnelles
          </h1>
          <p className="text-slate-400 mt-1">Gérez et catégorisez les sorties de caisse quotidiennes.</p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-rose-500 hover:bg-rose-455 text-white rounded-2xl font-bold shadow-lg shadow-rose-950/20 cursor-pointer"
        >
          <Plus size={18} />
          <span>Nouvelle Dépense</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Search Input */}
        <div className="relative lg:col-span-4">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher une dépense (Description, agent...)"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Category Select Filter */}
        <div className="relative lg:col-span-3">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <SlidersHorizontal size={16} />
          </span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="All">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
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
        <div className="lg:col-span-1">
          {(startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-rose-455 hover:text-rose-350 border border-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors text-center"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Sum Card */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex justify-between items-center">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total des Dépenses Filtrées</span>
        <p className="text-xl font-black text-rose-450">{formatFCFA(totalExpensesVal)}</p>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-4 px-6">Date & Heure</th>
                <th className="py-4 px-6">Catégorie</th>
                <th className="py-4 px-6">Description / Notes</th>
                <th className="py-4 px-6 text-right">Montant</th>
                <th className="py-4 px-6">Enregistré Par</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-350">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 px-6 text-slate-550">
                      {formatDate(exp.createdAt)} · <span className="text-[10px]">{formatTime(exp.createdAt)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        exp.category === 'Salaires' ? 'bg-amber-500/10 text-amber-400' :
                        exp.category === 'Eau' ? 'bg-blue-500/10 text-blue-400' :
                        exp.category === 'Divers' ? 'bg-slate-800 text-slate-400' :
                        'bg-rose-500/10 text-rose-455'
                      }`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-350 font-medium truncate max-w-xs">{exp.description}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-rose-400">{formatFCFA(exp.amount)}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{exp.recordedBy}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleEditClick(exp)}
                          disabled={exp.category === 'Salaires'} // Do not modify wage payments directly to prevent registry errors
                          className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Modifier la dépense"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(exp.id)}
                          disabled={exp.category === 'Salaires'}
                          className="p-1.5 bg-rose-955/20 hover:bg-rose-900/40 text-rose-455 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Supprimer la dépense"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Receipt className="h-12 w-12 mx-auto mb-2 opacity-35 text-slate-400" />
                    <span>Aucune dépense enregistrée.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
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
                  <Sparkles className="text-rose-400 mr-2 h-5 w-5" />
                  {editingExpense ? 'Modifier la Dépense' : 'Nouvelle Dépense'}
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
                {/* Category selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Catégorie Dépense</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    {categories.filter(c => c !== 'Salaires').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Montant Dépense (FCFA)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={amount || ''}
                    onChange={e => setAmount(Number(e.target.value))}
                    placeholder="Ex: 5000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description / Motif</label>
                  <textarea
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex: Achat de 2 barres de glace pour la conservation de la viande d'agneau."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date de la Dépense</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
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
                    className="w-1/2 py-3 bg-rose-500 hover:bg-rose-455 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    {editingExpense ? 'Modifier la Dépense' : 'Enregistrer Dépense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Supprimer la dépense"
        message="Voulez-vous vraiment supprimer cette dépense ?"
        type="danger"
        confirmText="Supprimer"
        cancelText="Conserver"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsConfirmOpen(false); setExpenseToDeleteId(null); }}
      />
    </div>
  );
}

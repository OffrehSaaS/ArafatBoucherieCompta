'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Salary, Employee } from '@/lib/db/store';
import { formatFCFA, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  CircleDollarSign, 
  Plus, 
  Search, 
  X,
  Sparkles,
  Info,
  Lock,
  Wallet,
  Coins,
  Edit3,
  Trash2
} from 'lucide-react';

export default function SalairesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Search/Filters State
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);

  // Confirm delete states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [salaryToDeleteId, setSalaryToDeleteId] = useState<string | null>(null);

  // Batch delete states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [dailyWage, setDailyWage] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paidAt, setPaidAt] = useState('');
  const [status, setStatus] = useState<'Payé' | 'Non payé'>('Payé');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = () => {
    setSalaries(LocalDbStore.getSalaries().sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
    const emps = LocalDbStore.getEmployees().filter(e => e.active);
    setEmployees(emps);
    setSelectedIds([]);
    if (emps.length > 0) {
      setEmployeeId(emps[0].id);
    }
    setPaidAt(new Date().toISOString().split('T')[0]);
  };

  if (!isAdmin) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center text-center p-6 bg-slate-900/30 border border-slate-800 rounded-3xl">
        <Lock className="h-16 w-16 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-black text-white">Accès Restreint</h2>
        <p className="text-slate-400 text-sm max-w-sm mt-2">
          Le module de gestion des salaires contient des informations confidentielles et n'est accessible qu'aux comptes Administrateurs.
        </p>
      </div>
    );
  }

  const handleOpenModal = () => {
    const emps = LocalDbStore.getEmployees().filter(e => e.active);
    setEmployees(emps);
    setEditingSalary(null);
    if (emps.length > 0) {
      setEmployeeId(emps[0].id);
    } else {
      setEmployeeId('');
    }
    setDailyWage(5000); // default suggested wage
    setAmountPaid(5000);
    setPaidAt(new Date().toISOString().split('T')[0]);
    setStatus('Payé');
    setNotes('Salaire journalier');
    setError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (sal: Salary) => {
    const emps = LocalDbStore.getEmployees().filter(e => e.active);
    setEmployees(emps);
    setEditingSalary(sal);
    setEmployeeId(sal.employeeId);
    setDailyWage(sal.dailyWage);
    setAmountPaid(sal.amountPaid);
    setPaidAt(sal.paidAt);
    setStatus(sal.status);
    setNotes(sal.notes);
    setError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSalaryToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleEmployeeChange = (empId: string) => {
    setEmployeeId(empId);
    // Optional: map typical daily wages per position if desired, or let user type.
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!employeeId) {
      setError('Veuillez sélectionner un employé.');
      return;
    }
    if (dailyWage < 0 || amountPaid < 0) {
      setError('Les montants ne peuvent pas être négatifs.');
      return;
    }
    if (!paidAt) {
      setError('Veuillez spécifier la date de prestation.');
      return;
    }

    try {
      const payload = {
        employeeId,
        dailyWage,
        amountPaid,
        status,
        notes,
        paidAt
      };

      if (editingSalary) {
        LocalDbStore.updateSalary(editingSalary.id, payload, user?.fullName || 'Administrateur');
      } else {
        LocalDbStore.paySalary(payload, user?.fullName || 'Administrateur');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  const handleConfirmDelete = () => {
    if (salaryToDeleteId) {
      try {
        LocalDbStore.deleteSalary(salaryToDeleteId, user?.fullName || 'Administrateur');
        setIsConfirmOpen(false);
        setSalaryToDeleteId(null);
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSalaries.map(s => s.id));
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
      const userName = user?.fullName || 'Administrateur';
      for (const id of selectedIds) {
        LocalDbStore.deleteSalary(id, userName);
      }
      setSelectedIds([]);
      setIsBatchConfirmOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue.');
    }
  };

  // Filter salaries
  const filteredSalaries = salaries.filter(s => 
    s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSalariesPaid = filteredSalaries.reduce((acc, s) => acc + s.amountPaid, 0);

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <CircleDollarSign className="text-emerald-450 mr-2 h-8 w-8" />
            Salaires & Rémunérations
          </h1>
          <p className="text-slate-400 mt-1">Enregistrez les émoluments journaliers des bouchers et caissiers.</p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          <Plus size={18} />
          <span>Payer un Salaire</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex items-start space-x-3">
        <Info className="text-emerald-400 h-5 w-5 mt-0.5 shrink-0" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-200">Liaison de Dépenses Automatique</p>
          <p className="text-slate-400 font-light leading-relaxed">
            Chaque versement de salaire journalier enregistré ici est **automatiquement** converti en dépense de caisse 
            sous la catégorie **"Salaires"** pour la journée concernée. Le solde du tiroir-caisse sera mis à jour en temps réel.
          </p>
        </div>
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
            placeholder="Rechercher par employé..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Sum Card */}
        <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl text-right">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Salaires Payés</span>
          <p className="text-md font-black text-emerald-400 mt-0.5">{formatFCFA(totalSalariesPaid)}</p>
        </div>
      </div>

      {/* Batch delete action bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-955/20 border border-rose-900/40 p-4 rounded-2xl flex items-center justify-between text-xs text-rose-250 backdrop-blur-md mb-4"
          >
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-rose-350">{selectedIds.length}</span>
              <span className="text-slate-455 font-medium">paiement(s) de salaire sélectionné(s) pour suppression</span>
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
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-4 px-6 w-10">
                  <input
                    type="checkbox"
                    checked={filteredSalaries.length > 0 && selectedIds.length === filteredSalaries.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-850 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="py-4 px-6">Date de Prestation</th>
                <th className="py-4 px-6">Employé</th>
                <th className="py-4 px-6 text-right">Taux Journalier</th>
                <th className="py-4 px-6 text-right">Montant Payé</th>
                <th className="py-4 px-6">Statut</th>
                <th className="py-4 px-6">Observations / Notes</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-350">
              {filteredSalaries.length > 0 ? (
                filteredSalaries.map(sal => (
                  <tr key={sal.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 px-6 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sal.id)}
                        onChange={() => handleSelectRow(sal.id)}
                        className="rounded border-slate-850 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer h-4 w-4"
                      />
                    </td>
                    <td className="py-4 px-6 text-slate-550 font-medium">
                      {formatDate(sal.paidAt)}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">{sal.employeeName}</td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-400">{formatFCFA(sal.dailyWage)}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-emerald-455">{formatFCFA(sal.amountPaid)}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded font-bold text-[9px] uppercase ${
                        sal.status === 'Payé' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                      }`}>
                        {sal.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-light truncate max-w-xs">{sal.notes || '-'}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleEditClick(sal)}
                          className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Modifier le salaire"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(sal.id)}
                          className="p-1.5 bg-rose-955/20 hover:bg-rose-900/40 text-rose-455 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer le salaire"
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
                    <Coins className="h-12 w-12 mx-auto mb-2 opacity-35 text-slate-400" />
                    <span>Aucun paiement de salaire enregistré.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Modal */}
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
                  <Sparkles className="text-emerald-450 mr-2 h-5 w-5" />
                  {editingSalary ? 'Modifier le Salaire' : 'Payer un Salaire'}
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
                {/* Employee selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Employé bénéficiaire</label>
                  <select
                    value={employeeId}
                    onChange={e => handleEmployeeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Choisir un employé --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.position})</option>
                    ))}
                  </select>
                </div>

                {/* Wage and Amount in row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Taux Journalier (FCFA)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={dailyWage || ''}
                      onChange={e => { setDailyWage(Number(e.target.value)); setAmountPaid(Number(e.target.value)); }}
                      placeholder="Ex: 5000"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Montant Payé (FCFA)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={amountPaid || ''}
                      onChange={e => setAmountPaid(Number(e.target.value))}
                      placeholder="Ex: 5000"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Date worked & Status in row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date de Prestation</label>
                    <input
                      type="date"
                      required
                      value={paidAt}
                      onChange={e => setPaidAt(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Statut Paiement</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Payé">Payé (Sortie caisse)</option>
                      <option value="Non payé">Non payé (Dû)</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Observations / Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ex: Payé en espèces de caisse"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
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
                    className="w-1/2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    {editingSalary ? 'Modifier le Paiement' : 'Valider le Paiement'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Supprimer le salaire"
        message="Voulez-vous vraiment supprimer cet enregistrement de salaire ? Cela annulera également la dépense de caisse associée."
        type="danger"
        confirmText="Supprimer"
        cancelText="Conserver"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsConfirmOpen(false); setSalaryToDeleteId(null); }}
      />

      {/* Delete Selection Confirmation */}
      <ConfirmDialog
        isOpen={isBatchConfirmOpen}
        title="Supprimer les salaires sélectionnés"
        message={`Voulez-vous vraiment supprimer les ${selectedIds.length} salaires sélectionnés ? Les dépenses de caisse associées seront également annulées.`}
        type="danger"
        confirmText="Supprimer les salaires"
        cancelText="Conserver"
        onConfirm={handleConfirmDeleteSelected}
        onCancel={() => setIsBatchConfirmOpen(false)}
      />
    </div>
  );
}

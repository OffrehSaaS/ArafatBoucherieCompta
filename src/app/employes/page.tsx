'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Employee, UserAccount } from '@/lib/db/store';
import { formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2,
  Search, 
  X,
  Sparkles,
  Info,
  Calendar,
  Phone,
  ShieldCheck,
  UserCheck,
  Lock,
  UserX
} from 'lucide-react';

export default function EmployesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('Boucher');
  const [hireDate, setHireDate] = useState('');
  const [active, setActive] = useState(true);
  const [workingDays, setWorkingDays] = useState<boolean[]>([true, true, true, true, true, true, false]);
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [employeeToDeleteId, setEmployeeToDeleteId] = useState<string | null>(null);

  // Accounts state
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'accounts'>('employees');

  // Password reset modal state
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [resetPwdAccountId, setResetPwdAccountId] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Delete account confirmation dialog state
  const [isDeleteAccConfirmOpen, setIsDeleteAccConfirmOpen] = useState(false);
  const [accountToDeleteId, setAccountToDeleteId] = useState<string | null>(null);

  const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = () => {
    setEmployees(LocalDbStore.getEmployees());
    setAccounts(LocalDbStore.getAccounts());
  };

  if (!isAdmin) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center text-center p-6 bg-slate-900/30 border border-slate-800 rounded-3xl">
        <Lock className="h-16 w-16 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-black text-white">Accès Restreint</h2>
        <p className="text-slate-400 text-sm max-w-sm mt-2">
          Le module employé contient des données de personnel confidentielles et n'est accessible qu'aux comptes Administrateurs.
        </p>
      </div>
    );
  }

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setPosition('Boucher');
    setHireDate(new Date().toISOString().split('T')[0]);
    setActive(true);
    setWorkingDays([true, true, true, true, true, true, false]);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFirstName(employee.firstName);
    setLastName(employee.lastName);
    setPhone(employee.phone);
    setPosition(employee.position);
    setHireDate(employee.hireDate);
    setActive(employee.active);
    setWorkingDays([...employee.workingDays]);
    setError('');
    setIsModalOpen(true);
  };

  const handleToggleDay = (index: number) => {
    const updated = [...workingDays];
    updated[index] = !updated[index];
    setWorkingDays(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Le prénom et le nom sont requis.');
      return;
    }

    const payload = {
      firstName,
      lastName,
      phone,
      position,
      hireDate,
      active,
      workingDays
    };

    const userName = user?.fullName || 'Administrateur';

    try {
      if (editingEmployee) {
        LocalDbStore.updateEmployee(editingEmployee.id, payload, userName);
      } else {
        LocalDbStore.addEmployee(payload, userName);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  const handleDelete = (id: string) => {
    setEmployeeToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (employeeToDeleteId) {
      try {
        LocalDbStore.deleteEmployee(employeeToDeleteId, user?.fullName || 'Administrateur');
        setIsConfirmOpen(false);
        setEmployeeToDeleteId(null);
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleToggleAccountActive = (id: string) => {
    try {
      LocalDbStore.toggleAccountActive(id, user?.fullName || 'Administrateur');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRoleChange = (id: string, role: 'admin' | 'vendeur') => {
    try {
      LocalDbStore.updateAccountRole(id, role, user?.fullName || 'Administrateur');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenResetPwdModal = (id: string) => {
    setResetPwdAccountId(id);
    setNewPasswordValue('');
    setResetPwdModalOpen(true);
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordValue.trim() || newPasswordValue.length < 4) {
      alert('Le mot de passe doit faire au moins 4 caractères.');
      return;
    }
    try {
      LocalDbStore.resetAccountPassword(resetPwdAccountId, newPasswordValue, user?.fullName || 'Administrateur');
      setResetPwdModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const triggerDeleteAccount = (id: string) => {
    setAccountToDeleteId(id);
    setIsDeleteAccConfirmOpen(true);
  };

  const handleConfirmDeleteAccount = () => {
    if (accountToDeleteId) {
      try {
        LocalDbStore.deleteAccount(accountToDeleteId, user?.fullName || 'Administrateur');
        setIsDeleteAccConfirmOpen(false);
        setAccountToDeleteId(null);
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <Users className="text-emerald-450 mr-2 h-8 w-8" />
            Gestion du Personnel
          </h1>
          <p className="text-slate-400 mt-1">Gérez vos employés physiques et configurez les comptes d'accès vendeurs.</p>
        </div>

        {activeTab === 'employees' && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-2xl font-bold shadow-lg shadow-emerald-500/10 cursor-pointer text-xs transition-colors"
          >
            <Plus size={18} />
            <span>Ajouter un Employé</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('employees')}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'employees'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          <Users size={15} />
          <span>Fiches Employés</span>
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'accounts'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Comptes Utilisateurs</span>
        </button>
      </div>

      {/* -------------------- TAB 1: EMPLOYEES GRID -------------------- */}
      {activeTab === 'employees' && (
        <>
          {/* Filters Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, prénom, poste..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(emp => (
                <div key={emp.id} className={`bg-slate-900 border p-5 rounded-3xl flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 group relative overflow-hidden ${
                  emp.active ? 'border-slate-850' : 'border-rose-955/30 bg-slate-900/40'
                }`}>
                  {/* Inactive tag */}
                  {!emp.active && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-slate-950 font-bold text-[8px] uppercase tracking-wider py-1 px-3 rounded-bl-xl flex items-center">
                      <UserX size={10} className="mr-1" />
                      Inactif
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${
                        emp.active ? 'bg-emerald-500/10 text-emerald-455 font-black' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {emp.firstName.slice(0, 1)}{emp.lastName.slice(0, 1)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm group-hover:text-emerald-450 transition-colors">
                          {emp.firstName} {emp.lastName}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">{emp.position}</p>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1.5 text-xs text-slate-450 border-t border-slate-850 pt-3">
                      <div className="flex items-center space-x-2">
                        <Phone size={13} className="text-slate-600" />
                        <span>{emp.phone || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar size={13} className="text-slate-600" />
                        <span>Embauché le : {formatDate(emp.hireDate)}</span>
                      </div>
                    </div>

                    {/* Planner schedule */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Planning de travail</span>
                      <div className="flex gap-1.5">
                        {weekdays.map((day, idx) => (
                          <div 
                            key={idx} 
                            className={`flex-1 py-1 rounded text-center text-[9px] font-bold ${
                              emp.workingDays[idx]
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-950 text-slate-600 border border-transparent'
                            }`}
                            title={emp.workingDays[idx] ? 'Jour travaillé' : 'Repos'}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex space-x-2.5 border-t border-slate-850/60 pt-4 mt-4">
                    <button
                      onClick={() => handleOpenEditModal(emp)}
                      className="w-1/2 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="w-1/2 py-2 bg-rose-955/20 border border-rose-900/30 hover:bg-rose-900/30 text-rose-455 hover:text-rose-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900 border border-slate-850 rounded-3xl">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-35 text-slate-400" />
                <span>Aucun employé enregistré.</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* -------------------- TAB 2: USER ACCOUNTS -------------------- */}
      {activeTab === 'accounts' && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden animate-fadeIn space-y-4">
          <div className="p-5 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Comptes Utilisateurs Enregistrés</h3>
            <span className="text-[10px] text-slate-500">{accounts.length} comptes au total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="py-4 px-6">Nom</th>
                  <th className="py-4 px-6">Adresse Email</th>
                  <th className="py-4 px-6">Téléphone</th>
                  <th className="py-4 px-6">Rôle</th>
                  <th className="py-4 px-6">Statut d'Accès</th>
                  <th className="py-4 px-6">Date de Création</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-350">
                {accounts.length > 0 ? (
                  accounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-850/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-white">{acc.fullName}</td>
                      <td className="py-4 px-6 font-mono text-slate-450">{acc.email}</td>
                      <td className="py-4 px-6 text-slate-450">{acc.phone}</td>
                      <td className="py-4 px-6">
                        {acc.email === user?.email ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Admin
                          </span>
                        ) : (
                          <select
                            value={acc.role}
                            onChange={(e) => handleRoleChange(acc.id, e.target.value as 'admin' | 'vendeur')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer ${
                              acc.role === 'admin' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            <option value="vendeur" className="bg-slate-900 text-amber-400">Vendeur</option>
                            <option value="admin" className="bg-slate-900 text-emerald-400">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          acc.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                          acc.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-rose-500/15 text-rose-455'
                        }`}>
                          {acc.status === 'active' ? 'Approuvé' :
                           acc.status === 'pending' ? 'En attente' : 'Désactivé'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(acc.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center space-x-2">
                          {/* Toggle Active status */}
                          {acc.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleAccountActive(acc.id)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
                                acc.status === 'active'
                                  ? 'bg-rose-955/20 hover:bg-rose-900/40 text-rose-455'
                                  : 'bg-emerald-500 hover:bg-emerald-450 text-slate-950 shadow-inner'
                              }`}
                              title={acc.status === 'active' ? 'Désactiver le compte' : 'Activer / Approuver'}
                            >
                              {acc.status === 'active' ? 'Désactiver' : 'Activer'}
                            </button>
                          )}
                          
                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenResetPwdModal(acc.id)}
                            className="p-1.5 bg-slate-805 hover:bg-slate-800 border border-slate-800 text-slate-350 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Réinitialiser mot de passe"
                          >
                            <Lock size={12} />
                          </button>

                          {/* Delete Account */}
                          {acc.role !== 'admin' && (
                            <button
                              onClick={() => triggerDeleteAccount(acc.id)}
                              className="p-1.5 bg-rose-955/20 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer définitivement"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Aucun compte utilisateur enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- ADD / EDIT EMPLOYEE MODAL -------------------- */}
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
              <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                <h3 className="text-lg font-extrabold text-white flex items-center">
                  <Sparkles className="text-emerald-455 mr-2 h-5 w-5" />
                  {editingEmployee ? 'Modifier Fiche Employé' : 'Ajouter un Employé'}
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

              <form onSubmit={handleSave} className="space-y-4 mt-4">
                {/* Names row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prénom</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Ex: Alassane"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nom</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Ex: Traoré"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Contact phone & post */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ex: +226 72 00 99 88"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Poste / Fonction</label>
                    <input
                      type="text"
                      required
                      value={position}
                      onChange={e => setPosition(e.target.value)}
                      placeholder="Ex: Boucher Principal"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Hire Date & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date d'embauche</label>
                    <input
                      type="date"
                      required
                      value={hireDate}
                      onChange={e => setHireDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Statut d'activité</label>
                    <select
                      value={active ? 'true' : 'false'}
                      onChange={e => setActive(e.target.value === 'true')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="true">Actif</option>
                      <option value="false">Inactif</option>
                    </select>
                  </div>
                </div>

                {/* Planning selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Planning hebdomadaire de présence</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {weekdays.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleDay(idx)}
                        className={`py-2 rounded text-center text-[10px] font-bold transition-all cursor-pointer border ${
                          workingDays[idx]
                            ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/30'
                            : 'bg-slate-950 text-slate-600 border-transparent hover:text-slate-400'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1 font-light italic">Cliquez sur un jour pour l'activer / le désactiver.</span>
                </div>

                {/* Footer Buttons */}
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
                    className="w-1/2 py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------- PASSWORD RESET MODAL -------------------- */}
      <AnimatePresence>
        {resetPwdModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setResetPwdModalOpen(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-850">
                <h3 className="text-sm font-extrabold text-white flex items-center">
                  <Lock className="text-emerald-450 mr-2 h-4 w-4" />
                  Réinitialiser le Mot de Passe
                </h3>
                <button
                  onClick={() => setResetPwdModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveResetPassword} className="space-y-4 mt-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nouveau mot de passe pour l'employé</label>
                  <input
                    type="password"
                    required
                    value={newPasswordValue}
                    onChange={e => setNewPasswordValue(e.target.value)}
                    placeholder="Entrez au moins 4 caractères"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-655 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetPwdModalOpen(false)}
                    className="w-1/2 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    Réinitialiser
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Employee Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Supprimer un employé"
        message="Voulez-vous vraiment supprimer cet employé ? Son planning et sa fiche de présence seront retirés, mais l'historique des salaires sera préservé."
        type="danger"
        confirmText="Supprimer"
        cancelText="Conserver"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsConfirmOpen(false); setEmployeeToDeleteId(null); }}
      />

      {/* Delete Account Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteAccConfirmOpen}
        title="Supprimer un compte"
        message="Voulez-vous vraiment supprimer définitivement ce compte de connexion vendeur ? L'employé associé ne pourra plus se connecter du tout."
        type="danger"
        confirmText="Supprimer"
        cancelText="Conserver"
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => { setIsDeleteAccConfirmOpen(false); setAccountToDeleteId(null); }}
      />
    </div>
  );
}

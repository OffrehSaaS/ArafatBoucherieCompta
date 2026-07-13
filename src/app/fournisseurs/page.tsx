'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocalDbStore, Supplier } from '@/lib/db/store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  Plus, 
  Edit3, 
  Search, 
  X,
  Sparkles,
  Info,
  Phone,
  MapPin
} from 'lucide-react';

export default function FournisseursPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Search/Filters State
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSuppliers(LocalDbStore.getSuppliers());
  };

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setPhone(supplier.phone);
    setAddress(supplier.address);
    setNotes(supplier.notes);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Le nom du fournisseur est obligatoire.');
      return;
    }
    if (!phone.trim()) {
      setError('Le numéro de téléphone est obligatoire.');
      return;
    }

    const payload = {
      name,
      phone,
      address,
      notes
    };

    const userName = user?.fullName || 'Utilisateur';

    try {
      if (editingSupplier) {
        LocalDbStore.updateSupplier(editingSupplier.id, payload, userName);
      } else {
        LocalDbStore.addSupplier(payload, userName);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <Truck className="text-emerald-450 mr-2 h-8 w-8" />
            Fournisseurs Référencés
          </h1>
          <p className="text-slate-400 mt-1">Gérez le répertoire de vos éleveurs et grossistes partenaires.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          <Plus size={18} />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher un fournisseur (Nom, téléphone, adresse...)"
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Grid Layout for Suppliers Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map(sup => (
            <div key={sup.id} className="bg-slate-900 border border-slate-850 p-5 rounded-3xl flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 group">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
                      {sup.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm group-hover:text-emerald-400 transition-colors">{sup.name}</h4>
                      <p className="text-[10px] text-slate-500">Créé le {new Date(sup.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Contacts details */}
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Phone size={14} className="text-slate-500" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-slate-500" />
                    <span className="truncate">{sup.address || 'Aucune adresse enregistrée'}</span>
                  </div>
                </div>

                {/* Notes */}
                {sup.notes && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 text-slate-500 text-xs italic font-light">
                    "{sup.notes}"
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end border-t border-slate-850 mt-4 pt-3 space-x-2">
                <button
                  onClick={() => handleOpenEditModal(sup)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
                >
                  <Edit3 size={12} />
                  <span>Modifier</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900 border border-slate-850 rounded-3xl">
            <Truck className="h-12 w-12 mx-auto mb-2 opacity-35 text-slate-400" />
            <span>Aucun fournisseur enregistré.</span>
          </div>
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
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
                  <Sparkles className="text-emerald-400 mr-2 h-5 w-5" />
                  {editingSupplier ? 'Modifier le Fournisseur' : 'Créer un Fournisseur'}
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
                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nom du Fournisseur</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Sani Élevage"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Téléphone de Contact</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ex: +226 70 00 11 22"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Adresse (Ville/Secteur)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Ex: Ouagadougou, Secteur 30"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Observations / Notes</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Informations supplémentaires, types d'animaux livrés..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-none focus:border-emerald-500 resize-none"
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
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HelpCircle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'danger' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  type = 'confirm',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 z-10"
          >
            {/* Header Icon */}
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-850">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                type === 'danger' ? 'bg-rose-500/10 text-rose-455' :
                type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                type === 'info' ? 'bg-blue-500/10 text-blue-400' :
                'bg-emerald-500/10 text-emerald-450'
              }`}>
                {type === 'danger' || type === 'warning' ? (
                  <AlertTriangle size={20} />
                ) : type === 'info' ? (
                  <Info size={20} />
                ) : (
                  <HelpCircle size={20} />
                )}
              </div>
              <h3 className="text-sm font-extrabold text-white leading-tight">{title}</h3>
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Message Body */}
            <div className="py-4 text-xs text-slate-350 leading-relaxed font-light">
              {message}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-1/2 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`w-1/2 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  type === 'danger' 
                    ? 'bg-rose-500 hover:bg-rose-455 text-white shadow-lg shadow-rose-950/20' 
                    : 'bg-emerald-500 hover:bg-emerald-450 text-slate-950 shadow-lg shadow-emerald-500/10'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl shadow-glass glassmorphism flex items-start justify-between gap-3 pointer-events-auto border transition-colors ${
                toast.type === 'success'
                  ? 'border-brand-green-200/50 bg-brand-green-50/90 text-brand-green-900 dark:bg-brand-green-950/80 dark:text-brand-green-100 dark:border-brand-green-900/30'
                  : toast.type === 'error'
                  ? 'border-red-200 bg-red-50/90 text-red-900 dark:bg-red-950/80 dark:text-red-100 dark:border-red-900/30'
                  : 'border-slate-200 bg-white/90 text-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:border-slate-800/30'
              }`}
            >
              <div className="flex gap-3 items-center py-0.5">
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

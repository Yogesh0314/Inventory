import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full sm:w-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-accentRose" />,
    warning: <AlertTriangle className="h-5 w-5 text-accentAmber" />,
    info: <Info className="h-5 w-5 text-accentBlue" />
  };

  const bgColors = {
    success: 'bg-emerald-950/40 border-emerald-500/30',
    error: 'bg-rose-950/40 border-accentRose/30',
    warning: 'bg-amber-950/40 border-accentAmber/30',
    info: 'bg-blue-950/40 border-accentBlue/30'
  };

  return (
    <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl border backdrop-blur-md shadow-2xl animate-slide-left ${bgColors[toast.type]}`}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">{icons[toast.type]}</div>
        <p className="text-sm font-semibold text-primaryText leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-secondaryText transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

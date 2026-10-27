import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => {
          let bg = 'bg-white border-l-4 border-emerald-600 text-gray-800';
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;

          if (toast.type === 'error') {
            bg = 'bg-white border-l-4 border-red-600 text-gray-800';
            icon = <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-white border-l-4 border-amber-500 text-gray-800';
            icon = <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
          } else if (toast.type === 'info') {
            bg = 'bg-white border-l-4 border-blue-600 text-gray-800';
            icon = <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded shadow-lg border border-gray-200 flex items-start justify-between gap-3 transition-all transform translate-y-0 ${bg}`}
            >
              <div className="flex items-start gap-3">
                {icon}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{toast.title}</h4>
                  {toast.message && <p className="text-xs text-gray-600 mt-0.5">{toast.message}</p>}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
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

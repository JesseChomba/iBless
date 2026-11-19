import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'celebrate';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue>({
  pushToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-md transition-all ${
              t.tone === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-950 dark:bg-rose-950/95 dark:border-rose-800 dark:text-rose-100'
                : t.tone === 'celebrate'
                ? 'bg-amber-50/95 border-amber-200 text-stone-900 dark:bg-amber-950/95 dark:border-amber-800 dark:text-amber-50'
                : 'bg-white/95 border-stone-200 text-stone-900 dark:bg-zinc-900/95 dark:border-zinc-800 dark:text-stone-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.tone === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              ) : t.tone === 'celebrate' ? (
                <Sparkles className="w-5 h-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{t.title}</p>
              {t.description && (
                <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  return useContext(ToastContext);
}

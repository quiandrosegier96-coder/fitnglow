"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

type Toast = { id: string; title: string; description?: string };
type ToastContextValue = { toast: (toast: Omit<Toast, "id">) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((item: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...item, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((toastItem) => toastItem.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-24 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:bottom-6">
        {toasts.map((item) => (
          <div key={item.id} className="glass-card rounded-3xl border border-primary/15 p-4">
            <div className="flex gap-3">
              <Sparkles className="mt-1 text-primary" size={18} />
              <div>
                <p className="font-bold">{item.title}</p>
                {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

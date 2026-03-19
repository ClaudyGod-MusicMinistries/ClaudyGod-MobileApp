import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastPayload {
  title: string;
  message?: string;
  tone?: ToastTone;
  durationMs?: number;
}

export interface ToastItem extends ToastPayload {
  id: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (_toast: ToastPayload) => string;
  dismissToast: (_id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastPayload) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast: ToastItem = {
      id,
      tone: toast.tone ?? 'info',
      durationMs: toast.durationMs ?? 3600,
      title: toast.title,
      message: toast.message,
    };

    setToasts((current) => [...current.slice(-2), nextToast]);

    const timer = setTimeout(() => {
      dismissToast(id);
    }, nextToast.durationMs);
    timers.current.set(id, timer);

    return id;
  }, [dismissToast]);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}

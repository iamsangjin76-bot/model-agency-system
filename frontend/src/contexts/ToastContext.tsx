import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  dismiss: (id: string) => void;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
}

// ── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 5;
const DEFAULT_DURATION_MS = 4000;
const ERROR_DURATION_MS = 6000;

// ── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = type === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS;

    setToasts(prev => {
      const next = [...prev, { id, type, message }];
      // Drop oldest when over limit
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });

    const timer = setTimeout(() => dismiss(id), duration);
    timers.current.set(id, timer);
  }, [dismiss]);

  const toast = {
    success: (message: string) => add('success', message),
    error:   (message: string) => add('error',   message),
    info:    (message: string) => add('info',     message),
    warning: (message: string) => add('warning',  message),
  };

  return (
    <ToastContext.Provider value={{ toasts, dismiss, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

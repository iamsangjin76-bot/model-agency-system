import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { type Toast, type ToastType, useToast } from '@/contexts/ToastContext';

// ── Per-type visual config ─────────────────────────────────────────────────

const CONFIG: Record<ToastType, {
  icon: React.ReactNode;
  bar: string;
  light: string;
  dark: string;
}> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    bar:   'bg-emerald-500',
    light: 'bg-white border-emerald-200 text-gray-800',
    dark:  'dark:bg-gray-800 dark:border-emerald-700 dark:text-gray-100',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    bar:   'bg-red-500',
    light: 'bg-white border-red-200 text-gray-800',
    dark:  'dark:bg-gray-800 dark:border-red-700 dark:text-gray-100',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    bar:   'bg-blue-500',
    light: 'bg-white border-blue-200 text-gray-800',
    dark:  'dark:bg-gray-800 dark:border-blue-700 dark:text-gray-100',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    bar:   'bg-amber-500',
    light: 'bg-white border-amber-200 text-gray-800',
    dark:  'dark:bg-gray-800 dark:border-amber-600 dark:text-gray-100',
  },
};

// ── Single toast item ──────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const cfg = CONFIG[toast.type];
  return (
    <div
      role="alert"
      className={[
        'relative flex items-start gap-3 w-80 rounded-xl border shadow-lg px-4 py-3 overflow-hidden',
        cfg.light,
        cfg.dark,
      ].join(' ')}
    >
      {/* Left accent bar */}
      <span className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${cfg.bar}`} />

      {cfg.icon}

      <p className="flex-1 text-sm leading-snug pt-0.5">{toast.message}</p>

      <button
        onClick={onDismiss}
        aria-label="닫기"
        className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </button>
    </div>
  );
}

// ── Container (fixed, top-right) ───────────────────────────────────────────

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

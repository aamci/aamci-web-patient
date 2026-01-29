'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  X,
} from 'lucide-react';

// Types
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  // Shorthand methods
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

// Context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newToast: Toast = {
        id,
        duration: 5000,
        ...toast,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) =>
      addToast({ variant: 'success', message, title }),
    [addToast]
  );

  const error = useCallback(
    (message: string, title?: string) =>
      addToast({ variant: 'error', message, title, duration: 7000 }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, title?: string) =>
      addToast({ variant: 'warning', message, title }),
    [addToast]
  );

  const info = useCallback(
    (message: string, title?: string) =>
      addToast({ variant: 'info', message, title }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast Item Component
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const variants = {
    info: {
      container: 'bg-slate-800 border-blue-500/50',
      icon: Info,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    success: {
      container: 'bg-slate-800 border-green-500/50',
      icon: CheckCircle,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
    },
    warning: {
      container: 'bg-slate-800 border-amber-500/50',
      icon: AlertTriangle,
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
    },
    error: {
      container: 'bg-slate-800 border-red-500/50',
      icon: XCircle,
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
    },
  };

  const config = variants[toast.variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm',
        'animate-in slide-in-from-right-full fade-in duration-300',
        'data-[removing=true]:animate-out data-[removing=true]:slide-out-to-right-full data-[removing=true]:fade-out',
        config.container
      )}
    >
      <div className={cn('p-2 rounded-lg flex-shrink-0', config.iconBg)}>
        <Icon className={cn('w-4 h-4', config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <h4 className="font-semibold text-white text-sm mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-sm text-slate-300">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast Container
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

export default ToastProvider;

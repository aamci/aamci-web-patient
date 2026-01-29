import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const variants = {
    info: {
      container: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      icon: Info,
      iconColor: 'text-blue-400',
    },
    success: {
      container: 'bg-green-500/10 border-green-500/30 text-green-400',
      icon: CheckCircle,
      iconColor: 'text-green-400',
    },
    warning: {
      container: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    error: {
      container: 'bg-red-500/10 border-red-500/30 text-red-400',
      icon: XCircle,
      iconColor: 'text-red-400',
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 p-4 rounded-xl border',
        config.container,
        className
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export interface ToastProps extends AlertProps {
  duration?: number;
  position?: 'top' | 'bottom';
}

export function Toast({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}: ToastProps) {
  return (
    <div
      className={cn(
        'fixed z-50 left-1/2 -translate-x-1/2 max-w-md w-full mx-4',
        'animate-in slide-in-from-top-4 fade-in duration-300',
        className
      )}
      style={{ top: '5rem' }}
    >
      <Alert variant={variant} title={title} onClose={onClose}>
        {children}
      </Alert>
    </div>
  );
}

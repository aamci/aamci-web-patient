import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export interface NoResultsProps {
  searchTerm?: string;
  onClear?: () => void;
  className?: string;
}

export function NoResults({ searchTerm, onClear, className }: NoResultsProps) {
  return (
    <EmptyState
      title="Aucun résultat trouvé"
      description={
        searchTerm
          ? `Aucun résultat pour "${searchTerm}". Essayez avec d'autres termes.`
          : 'Essayez de modifier vos filtres ou critères de recherche.'
      }
      action={
        onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-teal-400 hover:text-teal-300 text-sm font-medium"
          >
            Effacer la recherche
          </button>
        )
      }
      className={className}
    />
  );
}

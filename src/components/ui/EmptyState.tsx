import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon: Icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl transform scale-150" />
        <div className="relative w-20 h-20 rounded-3xl bg-white shadow-xl shadow-primary/5 flex items-center justify-center border border-white/50">
          <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 font-display">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <Button onClick={onAction} className="shadow-lg shadow-primary/20">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

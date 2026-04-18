import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { GlassCard } from './GlassCard';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      <GlassCard 
        className={cn(
          "relative w-full max-w-2xl bg-white/95 overflow-hidden shadow-2xl transition-all",
          "animate-in fade-in zoom-in-95 duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 font-display">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </GlassCard>
    </div>
  );
}

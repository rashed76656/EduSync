import { Bell, Megaphone, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/cn';
import { useNotifications } from '../../hooks/useNotifications';
import { useEffect } from 'react';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, isLoading, markAllAsRead } = useNotifications();

  useEffect(() => {
    // When the dropdown opens, we assume the user has "seen" them
    markAllAsRead();
  }, []);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Urgent': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Success': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
  };

  return (
    <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-primary/10 border border-white/50 ring-1 ring-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-50">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100/50 bg-white/50 flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Institute Signals
        </h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent 10</span>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-10 text-center space-y-3">
             <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receiving Frequencies...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Megaphone className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-900">Silence on the Waves</p>
            <p className="text-xs text-gray-400 mt-1">No global broadcasts found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100/50">
            {notifications.map((n) => (
              <div key={n.id} className="p-5 hover:bg-white/80 transition-all cursor-default group">
                <div className="flex gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                    getCategoryStyles(n.category)
                  )}>
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                       <span className={cn(
                         "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                         getCategoryStyles(n.category)
                       )}>
                         {n.category}
                       </span>
                       <h4 className="text-xs font-black text-gray-900 truncate">{n.title}</h4>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
                      {n.content}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                       <Clock className="w-3 h-3 text-gray-300" />
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                         {n.createdAt ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100/50">
        <button 
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary hover:border-primary/20 transition-all group"
        >
          Clear Viewport
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

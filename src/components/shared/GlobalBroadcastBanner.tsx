import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../utils/cn';

export default function GlobalBroadcastBanner() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'broadcasts'), 
      orderBy('createdAt', 'desc'), 
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setBroadcast({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        setIsVisible(true);
      } else {
        setBroadcast(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!broadcast || !isVisible) return null;

  const bgStyles = {
    Urgent: 'from-rose-600 to-rose-700 text-white',
    General: 'from-indigo-600 to-indigo-700 text-white',
    Success: 'from-emerald-600 to-emerald-700 text-white',
  };

  return (
    <div className={cn(
      "relative z-50 bg-gradient-to-r shadow-lg animate-in slide-in-from-top duration-500",
      bgStyles[broadcast.category as keyof typeof bgStyles] || bgStyles.General
    )}>
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Megaphone className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold truncate tracking-wide">
            <span className="uppercase opacity-70 mr-2">[{broadcast.category}]</span>
            {broadcast.title}: {broadcast.content}
          </p>
        </div>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Decorative pulse */}
      <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
    </div>
  );
}

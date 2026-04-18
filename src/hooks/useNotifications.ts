import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'broadcasts'), 
      orderBy('createdAt', 'desc'), 
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(docs);

      // Simple unread logic using localStorage timestamp
      const lastSeen = localStorage.getItem('last_seen_broadcast');
      if (lastSeen) {
        const lastSeenTime = parseInt(lastSeen);
        const unread = docs.filter((d: any) => 
          d.createdAt?.toMillis() > lastSeenTime
        ).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(docs.length);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAllAsRead = () => {
    localStorage.setItem('last_seen_broadcast', Date.now().toString());
    setUnreadCount(0);
  };

  return { notifications, unreadCount, isLoading, markAllAsRead };
}

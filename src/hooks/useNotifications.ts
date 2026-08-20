import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

export function useNotifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Listen for broadcasts
    const bQuery = query(
      collection(db, 'broadcasts'), 
      orderBy('createdAt', 'desc'), 
      limit(10)
    );

    // Listen for read markers (filtered by user for efficiency)
    const rQuery = query(
      collection(db, 'broadcast_reads'),
      where('userId', '==', user.uid)
    );

    const unsubscribeReads = onSnapshot(rQuery, (snapshot) => {
       const ids = new Set(
         snapshot.docs.map(d => d.data().broadcastId)
       );
       setReadIds(ids);
    });

    const unsubscribeBroadcasts = onSnapshot(bQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(docs);
      setIsLoading(false);
    });

    return () => {
      unsubscribeReads();
      unsubscribeBroadcasts();
    };
  }, [user]);

  // Re-calculate unread count whenever notifications or readIds change
  useEffect(() => {
    const unread = notifications.filter(n => !readIds.has(n.id)).length;
    setUnreadCount(unread);
  }, [notifications, readIds]);

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!readIds.has(n.id)) {
        const readRef = doc(db, 'broadcast_reads', `${user.uid}_${n.id}`);
        batch.set(readRef, {
          userId: user.uid,
          broadcastId: n.id,
          readAt: serverTimestamp()
        });
      }
    });
    
    await batch.commit();
  };

  return { notifications, unreadCount, isLoading, markAllAsRead, readIds };
}

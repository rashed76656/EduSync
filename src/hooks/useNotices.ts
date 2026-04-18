import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { Notice } from '../types';
import toast from 'react-hot-toast';

export function useNotices() {
  const { user } = useAuthStore();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notices'),
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noticeData: Notice[] = [];
      snapshot.forEach((docSnap) => {
        noticeData.push({ id: docSnap.id, ...docSnap.data() } as Notice);
      });
      
      // Client-side sort to ensure Pinned items stay at top
      const sortedNotices = [...noticeData].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });

      setNotices(sortedNotices);
      setIsLoading(false);
    }, (err) => {
      console.error('Firestore Sync Error:', err);
      toast.error('Notice sync error (Check console for index link)');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addNotice = async (data: Omit<Notice, 'id' | 'createdAt' | 'teacherId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'notices'), {
        ...data,
        teacherId: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success('Notice posted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to post notice');
      throw err;
    }
  };

  const updateNotice = async (id: string, updates: Partial<Notice>) => {
    try {
      const docRef = doc(db, 'notices', id);
      await updateDoc(docRef, updates);
      toast.success('Notice updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update notice');
      throw err;
    }
  };

  const deleteNotice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notices', id));
      toast.success('Notice deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete notice');
      throw err;
    }
  };

  return { notices, isLoading, addNotice, updateNotice, deleteNotice };
}

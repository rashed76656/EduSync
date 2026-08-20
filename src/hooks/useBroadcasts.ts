import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Broadcast } from '../types';
import toast from 'react-hot-toast';

export function useBroadcasts(filters?: { role?: string; department?: string; semester?: string }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Basic query: order by time
    const q = query(
      collection(db, 'broadcasts'),
      orderBy('postedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Broadcast));
      
      // Client-side filtering for complex multi-field matches
      if (filters) {
        data = data.filter(b => {
          // Role check
          const roleMatch = b.targetRole === 'all' || b.targetRole === filters.role;
          
          // Department check
          const deptMatch = !b.targetDepartment || b.targetDepartment === 'all' || b.targetDepartment === filters.department;
          
          // Semester check
          const semesterMatch = !b.targetSemester || b.targetSemester === 'all' || b.targetSemester === filters.semester;
          
          // Expiry check
          const nowTime = Date.now();
          const expiry = b.expiresAt ? (b.expiresAt instanceof Date ? b.expiresAt : (b.expiresAt as any).toDate()) : null;
          const notExpired = !expiry || expiry.getTime() > nowTime;

          return roleMatch && deptMatch && semesterMatch && notExpired;
        });
      }

      setBroadcasts(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [filters?.role, filters?.department, filters?.semester]);

  const postBroadcast = async (broadcast: Omit<Broadcast, 'id' | 'postedAt' | 'postedBy' | 'postedByName'>, adminName: string, adminId: string) => {
    try {
      const docRef = await addDoc(collection(db, 'broadcasts'), {
        ...broadcast,
        postedBy: adminId,
        postedByName: adminName,
        postedAt: serverTimestamp()
      });
      toast.success('Broadcast transmitted successfully');
      return docRef.id;
    } catch (error) {
      console.error(error);
      toast.error('Failed to post broadcast');
      return null;
    }
  };

  const removeBroadcast = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'broadcasts', id));
      toast.success('Broadcast removed');
    } catch (error) {
      toast.error('Failed to remove broadcast');
    }
  };

  return { broadcasts, isLoading, postBroadcast, removeBroadcast };
}

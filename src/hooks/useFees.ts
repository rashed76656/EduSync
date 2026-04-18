import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { FeeTransaction } from '../types';
import toast from 'react-hot-toast';

export function useFees() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const fetchStudentFees = useCallback(async (studentId: string) => {
    if (!user) return [];
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'fees'),
        where('teacherId', '==', user.uid),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const transactions: FeeTransaction[] = [];
      snapshot.forEach(docSnap => {
        transactions.push({ id: docSnap.id, ...docSnap.data() } as FeeTransaction);
      });
      return transactions;
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch fee records');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchAllFees = useCallback(async (limitCount?: number) => {
    if (!user) return [];
    setIsLoading(true);
    try {
      let q = query(
        collection(db, 'fees'),
        where('teacherId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      if (limitCount) {
        const { limit } = await import('firebase/firestore');
        q = query(q, limit(limitCount));
      }
      const snapshot = await getDocs(q);
      const transactions: FeeTransaction[] = [];
      snapshot.forEach(docSnap => {
        transactions.push({ id: docSnap.id, ...docSnap.data() } as FeeTransaction);
      });
      return transactions;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const recordFee = useCallback(async (feeData: Omit<FeeTransaction, 'id' | 'createdAt' | 'teacherId'>) => {
    if (!user) return null;
    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'fees'), {
        ...feeData,
        teacherId: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success('Payment recorded successfully');
      return docRef.id;
    } catch (err) {
      console.error(err);
      toast.error('Failed to record payment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return { isLoading, fetchStudentFees, fetchAllFees, recordFee };
}

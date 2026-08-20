import { useState, useCallback } from 'react';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { FeeRecord } from '../types';
import toast from 'react-hot-toast';

export function useFees() {
  const [isLoading, setIsLoading] = useState(false);

  const { role, department } = useAuthStore();

  const fetchStudentFees = useCallback(async (studentId: string) => {
    if (!studentId) return [];
    setIsLoading(true);
    try {
      const cleanId = studentId.trim();

      let q = query(
        collection(db, 'fees'),
        where('studentId', '==', cleanId),
        orderBy('createdAt', 'desc')
      );

      // If teacher, must filter by department to satisfy security rules
      if (role === 'teacher') {
        const isMissing = !department || department.toUpperCase() === 'UNASSIGNED';
        if (!isMissing) {
          q = query(
            collection(db, 'fees'),
            where('studentId', '==', cleanId),
            where('department', '==', department),
            orderBy('createdAt', 'desc')
          );
        }
      }

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FeeRecord));
      return docs;
    } catch (error: any) {
      console.error('Error fetching student fees:', error);
      if (error.code === 'permission-denied') {
        toast.error('Permission Denied: You can only view fees for your department.');
      } else {
        toast.error('Failed to load fee history');
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [role, department]);

  const addFee = async (fee: Omit<FeeRecord, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'fees'), {
        ...fee,
        createdAt: serverTimestamp(),
      });
      toast.success('Fee demand posted to ledger');
      return docRef.id;
    } catch (error) {
      console.error('Error adding fee:', error);
      toast.error('Failed to post fee');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllFees = useCallback(async (limitCount = 50) => {
    setIsLoading(true);
    try {
      let q = query(collection(db, 'fees'), orderBy('createdAt', 'desc'), limit(limitCount));
      
      const isDepartmentMissing = role === 'teacher' && (!department || department.toUpperCase() === 'UNASSIGNED');

      // If teacher, only fetch departmental fees (matches rules)
      if (role === 'teacher' && !isDepartmentMissing) {
        q = query(
          collection(db, 'fees'),
          where('department', '==', department),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FeeRecord));
    } catch (error) {
      console.error('Error fetching all fees:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [role, department]);

  return {
    fetchStudentFees,
    fetchAllFees,
    addFee,
    isLoading
  };
}

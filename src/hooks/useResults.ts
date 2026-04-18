import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { ResultRecord } from '../types';
import toast from 'react-hot-toast';

export function useResults() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const fetchResults = useCallback(async (semester: string, department: string, subject: string, examType: string) => {
    if (!user) return {};
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'results'),
        where('teacherId', '==', user.uid),
        where('semester', '==', semester),
        where('department', '==', department),
        where('subjectCode', '==', subject),
        where('examType', '==', examType)
      );
      const snapshot = await getDocs(q);
      const records: Record<string, ResultRecord> = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as ResultRecord;
        records[data.studentId] = { ...data, id: docSnap.id };
      });
      return records;
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch results');
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const getStudentResultsByStudent = useCallback(async (studentId: string) => {
    if (!user) return [];
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'results'),
        where('teacherId', '==', user.uid),
        where('studentId', '==', studentId)
      );
      const snapshot = await getDocs(q);
      const records: ResultRecord[] = [];
      snapshot.forEach(docSnap => {
        records.push({ ...docSnap.data(), id: docSnap.id } as ResultRecord);
      });
      return records;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveBatchResults = useCallback(async (records: Omit<ResultRecord, 'id' | 'teacherId'>[]) => {
    if (!user) return false;
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      
      records.forEach(record => {
        // Create a deterministic ID to prevent duplicates
        const docId = `${record.studentId}_${record.subjectCode}_${record.examType}`;
        const docRef = doc(db, 'results', docId);
        batch.set(docRef, {
          ...record,
          teacherId: user.uid,
          id: docId
        });
      });

      await batch.commit();
      toast.success('Results saved successfully');
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Failed to save results');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return { isLoading, fetchResults, getStudentResultsByStudent, saveBatchResults };
}

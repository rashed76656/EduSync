import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, writeBatch, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { AttendanceRecord } from '../types';
import toast from 'react-hot-toast';

export function useAttendance() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttendance = useCallback(async (date: string, semester: string, department: string, shift: string, group: string, subject: string) => {
    if (!user) return {};
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'attendance'),
        where('teacherId', '==', user.uid),
        where('date', '==', date),
        where('semester', '==', semester),
        where('department', '==', department),
        where('shift', '==', shift),
        where('group', '==', group),
        where('subjectCode', '==', subject)
      );
      const snapshot = await getDocs(q);
      const records: Record<string, AttendanceRecord> = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as AttendanceRecord;
        records[data.studentId] = { ...data, id: docSnap.id };
      });
      return records;
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch attendance');
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllAttendance = useCallback(async (limitCount?: number) => {
    if (!user) return [];
    setIsLoading(true);
    try {
      let q = query(
        collection(db, 'attendance'), 
        where('teacherId', '==', user.uid),
        orderBy('date', 'desc')
      );
      if (limitCount) {
        const { limit } = await import('firebase/firestore');
        q = query(q, limit(limitCount));
      }
      const snapshot = await getDocs(q);
      const records: AttendanceRecord[] = [];
      snapshot.forEach(docSnap => {
        records.push({ ...docSnap.data(), id: docSnap.id } as AttendanceRecord);
      });
      return records;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAttendanceRange = useCallback(async (startDate: string) => {
     if (!user) return [];
     setIsLoading(true);
     try {
       const q = query(
         collection(db, 'attendance'),
         where('teacherId', '==', user.uid),
         where('date', '>=', startDate),
         orderBy('date', 'desc')
       );
       const snapshot = await getDocs(q);
       const records: AttendanceRecord[] = [];
       snapshot.forEach(docSnap => {
         records.push({ ...docSnap.data(), id: docSnap.id } as AttendanceRecord);
       });
       return records;
     } catch (err) {
       console.error(err);
       return [];
     } finally {
       setIsLoading(false);
     }
  }, [user]);

  const getStudentAttendanceByStudent = useCallback(async (studentId: string) => {
    if (!user) return [];
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'attendance'),
        where('teacherId', '==', user.uid),
        where('studentId', '==', studentId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const records: AttendanceRecord[] = [];
      snapshot.forEach(docSnap => {
        records.push({ ...docSnap.data(), id: docSnap.id } as AttendanceRecord);
      });
      return records;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveBatchAttendance = useCallback(async (records: Omit<AttendanceRecord, 'id' | 'createdAt' | 'teacherId'>[]) => {
    if (!user) return false;
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      records.forEach(record => {
        const docRef = doc(collection(db, 'attendance'));
        batch.set(docRef, {
          ...record,
          teacherId: user.uid,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();
      toast.success('Attendance saved successfully');
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Failed to save attendance');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return { isLoading, fetchAttendance, fetchAllAttendance, fetchAttendanceRange, getStudentAttendanceByStudent, saveBatchAttendance };
}

import { useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  getDoc,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { Student } from '../types';
import toast from 'react-hot-toast';

export function useStudents() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async (limitCount?: number) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      let q = query(
        collection(db, 'students'), 
        where('teacherId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      if (limitCount) {
        const { limit } = await import('firebase/firestore');
        q = query(q, limit(limitCount));
      }
      const querySnapshot = await getDocs(q);
      const studentData: Student[] = [];
      querySnapshot.forEach((docSnap) => {
        studentData.push({ id: docSnap.id, ...docSnap.data() } as Student);
      });
      setStudents(studentData);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch students. Ensure Firestore rules allow reading.');
      toast.error('Could not load students');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getStudentById = useCallback(async (id: string): Promise<Student | null> => {
    try {
      const docRef = doc(db, 'students', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Student;
      }
      return null;
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student details');
      return null;
    }
  }, []);

  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'createdAt' | 'teacherId'>) => {
    if (!user) throw new Error("Authentication required");
    try {
      const docRef = await addDoc(collection(db, 'students'), {
        ...studentData,
        teacherId: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success('Student added successfully!');
      return docRef.id;
    } catch (err) {
      console.error(err);
      toast.error('Failed to add student');
      throw err;
    }
  }, [user]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    try {
      const docRef = doc(db, 'students', id);
      await updateDoc(docRef, updates);
      toast.success('Student updated successfully!');
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update student');
      throw err;
    }
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    try {
      const docRef = doc(db, 'students', id);
      await deleteDoc(docRef);
      toast.success('Student deleted');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete student');
      throw err;
    }
  }, []);

  return {
    students,
    isLoading,
    error,
    fetchStudents,
    getStudentById,
    addStudent,
    updateStudent,
    deleteStudent
  };
}

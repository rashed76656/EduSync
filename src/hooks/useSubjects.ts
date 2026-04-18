import { useState, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Subject } from '../types';

export function useSubjects() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubjects = useCallback(async (filters?: { department?: string; semester?: string }) => {
    setIsLoading(true);
    try {
      const subjectsRef = collection(db, 'subjects');
      let q = query(subjectsRef);

      if (filters?.department) {
        q = query(q, where('departmentShort', '==', filters.department));
      }
      if (filters?.semester) {
        q = query(q, where('semester', '==', filters.semester));
      }

      // Single field ordering is usually safe without complex indices
      const querySnapshot = await getDocs(q);
      const subjects = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          code: data.code || 'N/A',
          name: data.name || 'Unknown Subject',
          department: data.department || 'Unknown',
          departmentShort: data.departmentShort || 'N/A',
          semester: data.semester || 'N/A',
          regulation: data.regulation || '2022',
          isActive: data.isActive ?? true,
          createdAt: data.createdAt || new Date()
        };
      }) as Subject[];

      // Sort client-side by code to avoid index requirement
      return subjects.sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const subjectsRef = collection(db, 'subjects');
      // Fetch all without complex orderBy to avoid index requirement
      const querySnapshot = await getDocs(subjectsRef);
      const subjects = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Subject[];

      // Sort client-side
      return subjects.sort((a, b) => {
        const deptComp = a.departmentShort.localeCompare(b.departmentShort);
        if (deptComp !== 0) return deptComp;
        const semComp = a.semester.localeCompare(b.semester);
        if (semComp !== 0) return semComp;
        return a.code.localeCompare(b.code);
      });
    } catch (error) {
      console.error('Error fetching all subjects:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    fetchSubjects,
    getAllSubjects
  };
}

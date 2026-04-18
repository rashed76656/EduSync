import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Student, Department, Semester } from '../types';

interface GlobalStudentFilters {
  department?: Department | 'All';
  semester?: Semester | 'All';
  status?: string | 'All';
  searchQuery?: string;
}

export function useGlobalStudents(filters: GlobalStudentFilters = {}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    
    // Base query: all students ordered by name
    let q = query(collection(db, 'students'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));

        // Client-side filtering for complex combinations
        if (filters.department && filters.department !== 'All') {
          docs = docs.filter(s => s.department === filters.department);
        }
        if (filters.semester && filters.semester !== 'All') {
          docs = docs.filter(s => s.semester === filters.semester);
        }
        if (filters.status && filters.status !== 'All') {
          docs = docs.filter(s => s.status === filters.status);
        }
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          docs = docs.filter(s => 
            s.name.toLowerCase().includes(query) || 
            s.roll.toLowerCase().includes(query) ||
            s.registration.toLowerCase().includes(query)
          );
        }

        setStudents(docs);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching global students:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [filters.department, filters.semester, filters.status, filters.searchQuery]);

  return { students, isLoading, error };
}

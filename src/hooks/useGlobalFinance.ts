import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FeeRecord } from '../types';

export function useGlobalFinance() {
  const [transactions, setTransactions] = useState<FeeRecord[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    byDept: [] as { name: string, value: number }[],
    byType: [] as { name: string, value: number }[],
    recentTransactions: [] as FeeRecord[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'fees'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeRecord));
      
      // Calculate Stats — only confirmed payments count as revenue
      const confirmedDocs = docs.filter(t => t.paymentStatus === 'confirmed');
      const total = confirmedDocs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      // Group by Fee Type (replaces legacy `purpose` field)
      const typeMap: Record<string, number> = {};
      docs.forEach(t => {
        const label = t.type || t.description || 'Other';
        typeMap[label] = (typeMap[label] || 0) + (Number(t.amount) || 0);
      });

      // Group by Department
      const deptMap: Record<string, number> = {};
      confirmedDocs.forEach(t => {
        const dept = t.department || 'Unknown';
        deptMap[dept] = (deptMap[dept] || 0) + (Number(t.amount) || 0);
      });

      setTransactions(docs);
      setStats({
        totalRevenue: total,
        byDept: Object.entries(deptMap).map(([name, value]) => ({ name, value })),
        byType: Object.entries(typeMap).map(([name, value]) => ({ name, value })),
        recentTransactions: docs.slice(0, 10)
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { transactions, stats, isLoading };
}

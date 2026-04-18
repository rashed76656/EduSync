import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FeeTransaction } from '../types';

export function useGlobalFinance() {
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    byDept: [] as { name: string, value: number }[],
    byPurpose: [] as { name: string, value: number }[],
    recentTransactions: [] as FeeTransaction[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'fees'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeTransaction));
      
      // Calculate Stats
      const total = docs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      // Group by Purpose (more standard)
      const purposeMap: Record<string, number> = {};
      docs.forEach(t => {
        purposeMap[t.purpose] = (purposeMap[t.purpose] || 0) + (Number(t.amount) || 0);
      });

      setTransactions(docs);
      setStats({
        totalRevenue: total,
        byDept: [], // We'd need to join with students to get dept, will handle in dashboard if needed
        byPurpose: Object.entries(purposeMap).map(([name, value]) => ({ name, value })),
        recentTransactions: docs.slice(0, 10)
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { transactions, stats, isLoading };
}

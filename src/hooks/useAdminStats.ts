import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useAdminStats() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        // Parallel fetching for performance
        const [
          usersSnap,
          studentsSnap,
          feesSnap,
          logsSnap
        ] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'teacher'))),
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'fees')),
          getDocs(query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(10)))
        ]);

        const teachers = usersSnap.docs.map(d => d.data());
        const students = studentsSnap.docs.map(d => d.data());
        const fees = feesSnap.docs.map(d => d.data());

        // Process Department Data
        const deptData: Record<string, number> = {};
        students.forEach((s: any) => {
          deptData[s.department] = (deptData[s.department] || 0) + 1;
        });

        const chartData = Object.entries(deptData).map(([name, value]) => ({ name, value }));

        // Process Revenue Data (last 6 months - simplified)
        const revenue = fees.reduce((sum, f) => sum + (f.amount || 0), 0);

        setStats({
          teachers: {
            total: teachers.length,
            active: teachers.filter((t: any) => t.status === 'active').length,
            blocked: teachers.filter((t: any) => t.status === 'blocked').length
          },
          students: {
            total: students.length,
            byDept: chartData
          },
          revenue: {
            total: revenue
          }
        });

        setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Admin Stats Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  return { stats, logs, isLoading };
}

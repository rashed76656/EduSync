import { useState, useCallback } from 'react';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { Student, AttendanceRecord, ResultRecord, FeeRecord } from '../types';
import toast from 'react-hot-toast';

export function useStudentPortal() {
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { studentId: authStudentId } = useAuthStore();

  const fetchPortalData = useCallback(async (studentIdOverride?: string) => {
    const studentId = studentIdOverride || authStudentId;
    if (!studentId) return;

    setIsLoading(true);
    try {
      // 1. Student Basic Data
      const studentSnap = await getDoc(doc(db, 'students', studentId));
      if (studentSnap.exists()) {
        setStudentData({ id: studentSnap.id, ...studentSnap.data() } as Student);
      }

      // 2. Attendance
      const attQuery = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        orderBy('date', 'desc')
      );
      const attSnap = await getDocs(attQuery);
      setAttendance(attSnap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)));

      // 3. Results
      const resQuery = query(
        collection(db, 'results'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      const resSnap = await getDocs(resQuery);
      setResults(resSnap.docs.map(d => ({ id: d.id, ...d.data() } as ResultRecord)));

      // 4. Fees
      const feesQuery = query(
        collection(db, 'fees'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      const feesSnap = await getDocs(feesQuery);
      setFees(feesSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeeRecord)));

    } catch (error) {
      console.error('Error fetching portal data:', error);
      toast.error('Failed to synchronize portal data');
    } finally {
      setIsLoading(false);
    }
  }, [authStudentId]);

  const submitPaymentProof = async (fee: FeeRecord, trxId: string, note: string) => {
    setIsLoading(true);
    try {
      // 1. Create a notification for Account Manager
      await addDoc(collection(db, 'payment_notifications'), {
        feeId: fee.id,
        studentId: fee.studentId,
        studentName: fee.studentName,
        studentRoll: fee.studentRoll,
        studentReg: fee.studentReg,
        department: fee.department,
        semester: fee.semester,
        amount: fee.amount,
        totalAmount: fee.amount + (fee.lateFineAmount || 0),
        trxId,
        proofNote: note,
        proofType: 'trx_id',
        status: 'pending',
        submittedAt: serverTimestamp()
      });

      // 2. Update fee status to 'proof_submitted'
      await updateDoc(doc(db, 'fees', fee.id), {
        paymentStatus: 'proof_submitted',
        trxId,
        proofSubmittedAt: serverTimestamp()
      });

      // 3. Update local state
      setFees(prev => prev.map(f => f.id === fee.id ? { 
        ...f, 
        paymentStatus: 'proof_submitted', 
        trxId 
      } : f));

      toast.success('Payment proof submitted for review!');
      return true;
    } catch (error) {
      console.error('Proof submission error:', error);
      toast.error('Failed to submit payment proof');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    studentData,
    attendance,
    results,
    fees,
    isLoading,
    fetchPortalData,
    submitPaymentProof
  };
}

import { useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot,
  serverTimestamp,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FeeRecord, PaymentNotification } from '../types';
import { updateExamEligibility } from '../lib/examEligibility';
import toast from 'react-hot-toast';

export function useAccountManager() {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFees = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'fees'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      setFees(snap.docs.map(d => ({ id: d.id, ...d.data() } as FeeRecord)));
    } catch (error: any) {
      console.error('Error fetching fees for Account Manager:', error);
      toast.error('Failed to load fee ledger. Check permissions or network.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(() => {
    const q = query(
      collection(db, 'payment_notifications'),
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc')
    );

    return onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentNotification)));
    });
  }, []);

  const reviewPayment = async (notifId: string, feeId: string, status: 'confirmed' | 'rejected', reason?: string) => {
    try {
      // 1. Fetch Fee Record to get context (Student ID, Semester)
      const feeSnap = await getDoc(doc(db, 'fees', feeId));
      if (!feeSnap.exists()) throw new Error('Fee record not found');
      const feeData = feeSnap.data() as FeeRecord;

      // 2. Update Notification
      await updateDoc(doc(db, 'payment_notifications', notifId), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: 'account_manager', // Should be dynamic from auth
        rejectedReason: reason || null
      });

      // 3. Update Fee Record
      await updateDoc(doc(db, 'fees', feeId), {
        paymentStatus: status,
        confirmedAt: status === 'confirmed' ? serverTimestamp() : null,
        rejectedReason: status === 'rejected' ? reason : null,
        confirmedBy: status === 'confirmed' ? 'account_manager' : null
      });

      // 4. If confirmed, update student's financial clearance
      if (status === 'confirmed') {
        await updateExamEligibility(feeData.studentId, feeData.semester);
      }

      toast.success(`Payment ${status} successfully`);
    } catch (error) {
      toast.error('Failed to review payment');
      throw error;
    }
  };

  return {
    fees,
    notifications,
    isLoading,
    fetchFees,
    fetchNotifications,
    reviewPayment
  };
}

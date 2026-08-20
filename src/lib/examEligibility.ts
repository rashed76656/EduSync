import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Checks and updates a student's exam eligibility based on fee clearance.
 * Logic: A student is eligible if ALL 'tuition' and 'exam' fees for the current semester are 'confirmed'.
 */
export async function updateExamEligibility(studentId: string, semester: string) {
  try {
    const feesRef = collection(db, 'fees');
    const q = query(
      feesRef,
      where('studentId', '==', studentId),
      where('semester', '==', semester),
      where('paymentStatus', '!=', 'confirmed')
    );

    const snapshot = await getDocs(q);
    
    // Filter client-side for critical fee types (tuition/exam)
    const pendingCriticalFees = snapshot.docs.filter(d => {
      const data = d.data();
      return data.type === 'tuition' || data.type === 'exam';
    });

    const isEligible = pendingCriticalFees.length === 0;

    // Update student document
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      examEligible: isEligible
    });

    return isEligible;
  } catch (error) {
    console.error('Error updating exam eligibility:', error);
    return false;
  }
}

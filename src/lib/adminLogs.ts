import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type AdminLogAction = 
  | 'PROVISION_TEACHER'
  | 'BLOCK_TEACHER'
  | 'UNBLOCK_TEACHER'
  | 'DELETE_TEACHER'
  | 'POST_BROADCAST'
  | 'DELETE_BROADCAST'
  | 'SEED_CURRICULUM'
  | 'UPDATE_SETTINGS'
  | 'BULK_PROMOTION';

export interface AdminLog {
  adminUid: string;
  adminEmail: string;
  action: AdminLogAction;
  targetId?: string;
  targetName?: string;
  details: string;
  timestamp: any;
}

export const logAdminAction = async (log: Omit<AdminLog, 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'admin_logs'), {
      ...log,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

import { create } from 'zustand';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { InstituteBranding, UserRole } from '../types';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  status: 'active' | 'blocked' | null;
  branding: InstituteBranding | null;
  unit: string | null;
  phone: string | null;
  displayName: string | null;
  isLoading: boolean;

  // Student-specific fields
  studentId: string | null;
  linkedTeacherId: string | null;
  roll: string | null;
  registration: string | null;
  semester: string | null;
  department: string | null;

  setUser: (user: User | null) => void;
  setRole: (role: UserRole | null) => void;
  setBranding: (branding: InstituteBranding | null) => void;
  setProfileData: (data: Partial<AuthState>) => void;
  setLoading: (isLoading: boolean) => void;
  fetchProfile: (uid: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  status: null,
  branding: null,
  unit: null,
  phone: null,
  displayName: null,
  isLoading: true,
  studentId: null,
  linkedTeacherId: null,
  roll: null,
  registration: null,
  semester: null,
  department: null,

  setUser: (user) => set({ 
    user, 
    role: null, 
    status: null, 
    branding: null, 
    unit: null, 
    phone: null,
    displayName: null,
    studentId: null,
    linkedTeacherId: null,
    roll: null,
    registration: null,
    semester: null,
    department: null,
  }),
  setRole: (role) => set({ role }),
  setBranding: (branding) => set({ branding }),
  setProfileData: (data) => set((state) => ({ ...state, ...data })),
  setLoading: (isLoading) => set({ isLoading }),
  fetchProfile: async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // SECURITY CHECK: Blocked User
        if (data.status === 'blocked') {
          await signOut(auth);
          set({ 
            user: null, role: null, status: null, branding: null, isLoading: false, 
            studentId: null, linkedTeacherId: null, roll: null, registration: null, 
            semester: null, department: null 
          });
          toast.error('Access Denied: Your account has been suspended by administration.', { duration: 5000 });
          return;
        }

        set({ 
          branding: data.branding || null, 
          role: data.role || 'teacher',
          status: data.status || 'active',
          unit: data.unit || null,
          phone: data.phone || data.mobile || null,
          // Support both 'name' (console/manual) and 'displayName' (app/auth)
          displayName: data.displayName || data.name || null,
          // Student-specific fields
          studentId: data.studentId || null,
          linkedTeacherId: data.teacherId || null,
          roll: data.roll || null,
          registration: data.registration || null,
          semester: data.semester || null,
          department: data.department || null,
        });

        // Update lastLogin tracking
        await updateDoc(docRef, {
          lastLogin: serverTimestamp()
        });
      } else {
        // Handle case where auth user exists but Firestore profile is missing
        await signOut(auth);
        set({ 
          user: null, role: null, status: null, branding: null, isLoading: false, 
          studentId: null, linkedTeacherId: null, roll: null, registration: null, 
          semester: null, department: null 
        });
        toast.error('System Error: User profile configuration not found. Please contact administration.');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }
}));

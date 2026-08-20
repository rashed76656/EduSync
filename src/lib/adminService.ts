import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  doc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, firebaseConfig } from './firebase';
import type { UserRole } from '../types';

// ─── Generic Account Creator (Secondary App Pattern) ────────
// Used for creating teachers, account managers, and student portal accounts
// without disrupting the current admin/teacher session.
const createAccountWithSecondaryApp = async (data: {
  displayName: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  phone?: string;
  adminUid: string;
  extraFields?: Record<string, any>;
}) => {
  const secondaryAppName = `temp-creator-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth, 
      data.email, 
      data.password
    );
    const newUser = userCredential.user;

    await updateProfile(newUser, { displayName: data.displayName });

    const userRef = doc(db, 'users', newUser.uid);
    await setDoc(userRef, {
      uid: newUser.uid,
      displayName: data.displayName,
      name: data.displayName,
      email: data.email,
      role: data.role,
      status: 'active',
      department: data.department || '',
      phone: data.phone || '',
      joinedAt: serverTimestamp(),
      lastLogin: null,
      approvedAt: serverTimestamp(),
      approvedBy: data.adminUid,
      ...(data.extraFields || {}),
    });

    await secondaryAuth.signOut();
    return { success: true, uid: newUser.uid };

  } finally {
    await deleteApp(secondaryApp);
  }
};

// ─── Create Teacher Account ─────────────────────────────────
export const createTeacherAccount = async (data: {
  displayName: string;
  email: string;
  password: string;
  department?: string;
  phone?: string;
  adminUid: string;
}) => {
  return createAccountWithSecondaryApp({
    ...data,
    role: 'teacher',
  });
};

// ─── Create Account Manager ─────────────────────────────────
export const createAccountManagerAccount = async (data: {
  displayName: string;
  email: string;
  password: string;
  department?: string;
  phone?: string;
  adminUid: string;
}) => {
  return createAccountWithSecondaryApp({
    ...data,
    role: 'account_manager',
  });
};

// ─── Create Student Portal Account ──────────────────────────
// Teacher creates a Firebase Auth account for a student using
// the student's email + secret code as credentials.
export const createStudentPortalAccount = async (data: {
  studentName: string;
  studentEmail: string;
  studentRoll: string;
  studentRegistration: string;
  studentSemester: string;
  secretCode: string;
  studentId: string;
  teacherId: string;
  department?: string;
}) => {
  const secondaryAppName = `temp-student-creator-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // Create Firebase Auth user for student (secret code = password)
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth, 
      data.studentEmail, 
      data.secretCode
    );
    const newUser = userCredential.user;

    await updateProfile(newUser, { displayName: data.studentName });

    // Create /users/{uid} document for student
    const userRef = doc(db, 'users', newUser.uid);
    await setDoc(userRef, {
      uid: newUser.uid,
      name: data.studentName,
      displayName: data.studentName,
      email: data.studentEmail,
      role: 'student',
      status: 'active',
      studentId: data.studentId,
      roll: data.studentRoll,
      registration: data.studentRegistration,
      semester: data.studentSemester,
      department: data.department || '',
      secretCode: data.secretCode,
      teacherId: data.teacherId,
      joinedAt: serverTimestamp(),
      lastLogin: null,
    });

    // Update student document with uid and portal access flag
    const studentRef = doc(db, 'students', data.studentId);
    await updateDoc(studentRef, {
      uid: newUser.uid,
      email: data.studentEmail,
      secretCode: data.secretCode,
      hasPortalAccess: true,
    });

    await secondaryAuth.signOut();
    return { success: true, uid: newUser.uid };

  } finally {
    await deleteApp(secondaryApp);
  }
};

// ─── Delete Teacher/AM Data (Cascading Cleanup) ─────────────
export const deleteTeacherData = async (teacherUid: string) => {
  const collections = ['students', 'attendance', 'results', 'fees', 'notices', 'events', 'reports'];
  const batch = writeBatch(db);

  for (const collectionName of collections) {
    const q = query(collection(db, collectionName), where('teacherId', '==', teacherUid));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => batch.delete(doc.ref));
  }

  // Delete user profile
  batch.delete(doc(db, 'users', teacherUid));

  // Commit deletion of all Firestore data
  await batch.commit();

  // NOTE: Deleting from Firebase Auth Console is still required manually 
  // unless we use Cloud Functions or the admin re-auths as the teacher to self-delete.
  return { success: true };
};

// ─── Delete Account Manager Data ─────────────────────────────
export const deleteAccountManagerData = async (amUid: string) => {
  const batch = writeBatch(db);
  // Account managers don't own student data, just delete their user doc
  batch.delete(doc(db, 'users', amUid));
  await batch.commit();
  return { success: true };
};

// ─── Seeding Global Subjects from BTEB Data ─────────────────
export const seedInstituteSubjects = async (subjectsData: any) => {
  const batch = writeBatch(db);
  let count = 0;

  for (const [deptName, deptInfo] of Object.entries(subjectsData) as [string, any][]) {
    const { code: deptCode, shortName, semesters } = deptInfo;
    
    for (const [semester, subjects] of Object.entries(semesters) as [string, any][]) {
      for (const sub of subjects) {
        // Unique ID for the subject: DEPT_SEM_CODE
        const subId = `${shortName}_${semester}_${sub.code}`.replace(/\s+/g, '');
        const subRef = doc(db, 'subjects', subId);
        
        batch.set(subRef, {
          id: subId,
          code: sub.code,
          name: sub.name,
          department: deptName,
          departmentCode: deptCode,
          departmentShort: shortName,
          semester: semester,
          regulation: '2022', // Defaulting to latest common
          isActive: true,
          createdAt: serverTimestamp()
        });
        count++;
      }
    }
  }

  await batch.commit();
  return { success: true, count };
};

// ─── Bulk Update for Promotion & Status Changes ─────────────
export const bulkUpdateStudents = async (studentIds: string[], updates: any) => {
  const batch = writeBatch(db);
  
  studentIds.forEach(id => {
    const ref = doc(db, 'students', id);
    batch.update(ref, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
  return { success: true, count: studentIds.length };
};

// ─── Helper: Determine Next Semester ─────────────────────────
export const getNextSemester = (current: string): { semester: any; status: string } => {
  const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  const currentIndex = semesters.indexOf(current);
  
  if (currentIndex === -1) return { semester: current, status: 'active' };
  if (currentIndex === semesters.length - 1) {
    return { semester: '8th', status: 'dropped' }; // Fallback
  }
  
  // Custom logic for Alumni
  if (current === '8th') return { semester: '8th', status: 'dropped' };
  
  return { semester: semesters[currentIndex + 1], status: 'active' };
};

export async function migrateInstitutionalData() {
  const batch = writeBatch(db);
  let studentCount = 0;
  let feeCount = 0;

  try {
    // 1. Migrate Students (Add hasPortalAccess and examEligible if missing)
    const studentsSnap = await getDocs(collection(db, 'students'));
    studentsSnap.forEach(s => {
      const data = s.data();
      if (data.hasPortalAccess === undefined || data.examEligible === undefined) {
        batch.update(s.ref, {
          hasPortalAccess: data.hasPortalAccess ?? false,
          examEligible: data.examEligible ?? true
        });
        studentCount++;
      }
    });

    // 2. Migrate Fees (Map purpose -> description, status -> paymentStatus)
    const feesSnap = await getDocs(collection(db, 'fees'));
    feesSnap.forEach(f => {
      const data = f.data();
      const updates: any = {};
      
      // Map legacy status
      if (data.status && !data.paymentStatus) {
        if (data.status === 'Paid' || data.status === 'Complete') updates.paymentStatus = 'confirmed';
        else if (data.status === 'Pending') updates.paymentStatus = 'proof_submitted';
        else updates.paymentStatus = 'unpaid';
      }

      // Map legacy purpose
      if (data.purpose && !data.description) {
        updates.description = data.purpose;
        updates.type = 'other'; // Default for legacy
      }

      // Add missing fields
      if (data.visibleToStudent === undefined) updates.visibleToStudent = true;
      if (data.visibleToAccountManager === undefined) updates.visibleToAccountManager = true;
      if (!data.dueDate) {
        // Default due date to 30 days after creation or now
        const created = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const due = new Date(created);
        due.setDate(due.getDate() + 30);
        updates.dueDate = due;
      }

      if (Object.keys(updates).length > 0) {
        batch.update(f.ref, updates);
        feeCount++;
      }
    });

    await batch.commit();
    return { success: true, studentCount, feeCount };
  } catch (error) {
    console.error('Migration Error:', error);
    throw error;
  }
}

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
} from 'firebase/firestore';
import { db, firebaseConfig } from './firebase';

// Function to safely create a teacher without breaking admin session
// We use a secondary Firebase App instance locally
export const createTeacherAccount = async (data: {
  displayName: string;
  email: string;
  password: string;
  department?: string;
  phone?: string;
  adminUid: string;
}) => {
  // 1. Initialize a secondary, temporary Firebase app
  const secondaryAppName = `temp-teacher-creator-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // 2. Create the Auth record using the secondary instance
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth, 
      data.email, 
      data.password
    );
    const newUser = userCredential.user;

    // 3. Update the temporary user's profile
    await updateProfile(newUser, { displayName: data.displayName });

    // 4. Create the Firestore record using the main app's Firestore instance
    // (Auth and Firestore are independent in this regard)
    const userRef = doc(db, 'users', newUser.uid);
    await setDoc(userRef, {
      uid: newUser.uid,
      displayName: data.displayName,
      email: data.email,
      role: 'teacher',
      status: 'active',
      department: data.department || '',
      phone: data.phone || '',
      joinedAt: serverTimestamp(),
      lastLogin: null,
      approvedAt: serverTimestamp(),
      approvedBy: data.adminUid,
    });

    // 5. Cleanup: Sign out the secondary instance (optional but good)
    await secondaryAuth.signOut();
    return { success: true, uid: newUser.uid };

  } finally {
    // 6. Always destroy the secondary app instance
    await deleteApp(secondaryApp);
  }
};

// Function to delete all teacher data with cascading cleanup
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
  // Since we don't have Cloud Functions, we notify the admin to also delete from Auth Console.
  return { success: true };
};

// New: Seeding Global Subjects from BTEB Data
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

// New: Bulk update for Promotion & Status changes
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

// Helper: Determine next semester
export const getNextSemester = (current: string): { semester: any; status: string } => {
  const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  const currentIndex = semesters.indexOf(current);
  
  if (currentIndex === -1) return { semester: current, status: 'active' };
  if (currentIndex === semesters.length - 1) {
    return { semester: '8th', status: 'dropped' }; // Fallback
  }
  
  // Custom logic for Alumni
  if (current === '8th') return { semester: '8th', status: 'dropped' }; // We'll handle 'Alumni' specially in UI
  
  return { semester: semesters[currentIndex + 1], status: 'active' };
};

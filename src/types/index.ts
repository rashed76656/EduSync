import type { Timestamp } from 'firebase/firestore';

// ─── Core Enums ─────────────────────────────────────────────
export type Semester = '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th' | '7th' | '8th';
export type Department = 'CST' | 'EET' | 'CET' | 'MT' | 'RAC' | 'AT' | 'FT' | 'ET' | 'PT';
export type Shift = 'Morning' | 'Day';
export type Group = 'A' | 'B' | 'C';
export type StudentStatus = 'active' | 'inactive' | 'dropped';

// ─── Roles (4-role system) ──────────────────────────────────
export type UserRole = 'admin' | 'teacher' | 'account_manager' | 'student';

// ─── User Document (Firestore /users/{uid}) ─────────────────
export interface UserDocument {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  status: 'active' | 'blocked';
  department?: string;
  phone?: string;
  joinedAt: Timestamp | Date;
  lastLogin: Timestamp | Date | null;

  // Student-specific fields (role === "student")
  studentId?: string;       // Reference to /students/{id}
  secretCode?: string;      // Login credential (hashed ideally)
  teacherId?: string;       // Which teacher's student

  // Teacher/Admin extras
  displayName?: string;
  unit?: string;
  branding?: InstituteBranding;
  approvedAt?: Timestamp | Date;
  approvedBy?: string;
  blockedAt?: Timestamp | Date;
  blockedReason?: string;
}

// ─── Student ────────────────────────────────────────────────
export interface Student {
  id: string; // Document ID
  teacherId: string; // Firebase Auth UID
  name: string;
  roll: string;
  registration: string;
  semester: Semester;
  department: Department;
  shift: Shift;
  group: Group;
  session: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  bloodGroup: string;
  dateOfBirth: Timestamp | Date; // Using serverTimestamp or JS Date
  nid?: string;
  photo?: string;
  status: StudentStatus;
  createdAt: Timestamp | Date;
  createdBy: string;

  // Portal access fields (Register Branch upgrade)
  email?: string;              // Student email for portal login
  secretCode?: string;         // Teacher-generated secret code
  hasPortalAccess: boolean;    // Whether portal access is enabled
  uid?: string;                // Firebase Auth UID (set on portal creation)
  examEligible: boolean;       // Fee clearance for exam eligibility
}

// ─── Attendance ─────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string; // Document ID
  teacherId: string; // Firebase Auth UID
  date: string; // YYYY-MM-DD
  studentId: string;
  semester: Semester;
  department: Department;
  shift: Shift;
  group: Group;
  subject: string;
  subjectCode: string;
  status: AttendanceStatus;
  recordedBy: string;
  createdAt: Timestamp | Date;
}

// ─── Subject ────────────────────────────────────────────────
export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  departmentCode: string;
  departmentShort: string;
  semester: Semester;
  regulation: string;
  isActive: boolean;
  createdAt: Timestamp | Date;
}

// ─── Results ────────────────────────────────────────────────
export interface ResultRecord {
  id: string;
  teacherId: string;
  studentId: string;
  semester: Semester;
  department: Department;
  subject: string;
  subjectCode: string;
  examType: 'Midterm' | 'Final' | 'ClassTest';
  marks: number;
  grade: string;
  gradePoint: number;
  recordedBy: string;
  createdAt: Timestamp | Date;
}

// ─── Fees (Redesigned for 4-role payment flow) ──────────────
export type FeeType = 'tuition' | 'exam' | 'library' | 'fine' | 'late_fine' | 'other';
export type PaymentStatus = 'unpaid' | 'proof_submitted' | 'confirmed' | 'rejected';
export type ProofType = 'trx_id' | 'receipt_image';

export interface FeeRecord {
  id: string;
  teacherId: string;          // Who created the fee
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentReg: string;
  department: string;
  semester: string;

  type: FeeType;
  description: string;
  amount: number;
  dueDate: Timestamp | Date;  // Payment deadline

  // Payment Status Flow
  paymentStatus: PaymentStatus;

  // Student payment proof
  proofSubmittedAt?: Timestamp | Date;
  proofType?: ProofType;
  trxId?: string;             // Transaction ID (bKash/Nagad/Bank)
  proofNote?: string;         // Student's note

  // Account Manager confirmation
  confirmedBy?: string;       // Account manager UID
  confirmedAt?: Timestamp | Date;
  rejectedReason?: string;

  // Late fine
  lateFineAmount?: number;    // Auto-calculated
  lateFineApplied?: boolean;

  // Visibility
  visibleToStudent: boolean;
  visibleToAccountManager: boolean;

  createdAt: Timestamp | Date;
}

// Note: Legacy FeeTransaction/FeeStatus types removed — all code now uses FeeRecord + PaymentStatus.

// ─── Payment Notifications ─────────────────────────────────
export interface PaymentNotification {
  id: string;
  feeId: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentReg: string;
  department: string;
  semester: string;
  amount: number;
  lateFineAmount?: number;
  totalAmount: number;
  proofType: ProofType;
  trxId?: string;
  proofNote?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  submittedAt: Timestamp | Date;
  reviewedAt?: Timestamp | Date;
  reviewedBy?: string;
}

// ─── Broadcasts (Admin → All roles) ────────────────────────
export interface Broadcast {
  id: string;
  title: string;
  message: string;
  category?: 'General' | 'Urgent' | 'Success';
  targetRole: 'all' | 'student' | 'teacher' | 'account_manager';
  targetDepartment?: string;  // "all" or specific department
  targetSemester?: string;
  postedBy: string;           // Admin UID
  postedByName: string;
  postedAt: Timestamp | Date;
  expiresAt?: Timestamp | Date;
}

// ─── Notices ────────────────────────────────────────────────
export type NoticeCategory = 'General' | 'Exam' | 'Holiday' | 'Urgent';

export interface Notice {
  id: string;
  teacherId: string;
  title: string;
  category: NoticeCategory;
  content: string;
  targetDepartment: Department | 'All';
  targetSemester: Semester | 'All';
  isPinned: boolean;
  expiresAt?: Timestamp | Date;
  createdBy: string;
  createdAt: Timestamp | Date;
}

// ─── Events ─────────────────────────────────────────────────
export type EventCategory = 'Exam' | 'Holiday' | 'Cultural' | 'Academic' | 'Personal';

export interface InstituteEvent {
  id: string;
  teacherId: string;
  title: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  description?: string;
  createdBy: string;
  createdAt: Timestamp | Date;
}

// ─── Institute Branding ─────────────────────────────────────
export interface InstituteBranding {
  name: string;
  shortName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  website?: string;
}

// ─── Teacher/Staff Profile (used in Admin panel) ────────────
export interface TeacherProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  unit?: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'blocked';
  department?: string;
  joinedAt: Timestamp | Date;
  lastLogin: Timestamp | Date | null;
  approvedAt?: Timestamp | Date;
  approvedBy?: string;
  blockedAt?: Timestamp | Date;
  blockedReason?: string;
  branding?: InstituteBranding;
}

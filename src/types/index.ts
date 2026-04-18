import type { Timestamp } from 'firebase/firestore';

export type Semester = '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th' | '7th' | '8th';
export type Department = 'CST' | 'EET' | 'CET' | 'MT' | 'RAC' | 'AT' | 'FT' | 'ET' | 'PT';
export type Shift = 'Morning' | 'Day';
export type Group = 'A' | 'B' | 'C';
export type StudentStatus = 'active' | 'inactive' | 'dropped';

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
}

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

export interface FeeTransaction {
  id: string;
  teacherId: string;
  studentId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  purpose: string;
  paymentMethod: 'Cash' | 'Mobile Banking' | 'Bank';
  recordedBy: string;
  createdAt: Timestamp | Date;
}

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

export interface TeacherProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  unit?: string;
  phone?: string;
  role: 'teacher' | 'admin';
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

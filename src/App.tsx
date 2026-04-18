import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';

import { auth } from './lib/firebase';
import { useAuthStore } from './store/authStore';
import { AdminRoute, TeacherRoute, PublicRoute } from './components/shared/RouteGuards';
import AppShell from './components/layout/AppShell';
import AdminAppShell from './components/layout/AdminAppShell';

// Lazy loading components
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentList = lazy(() => import('./pages/Students/StudentList'));
const StudentDetail = lazy(() => import('./pages/Students/StudentDetail'));
const Attendance = lazy(() => import('./pages/Academic/Attendance'));
const Results = lazy(() => import('./pages/Academic/Results'));
const Subjects = lazy(() => import('./pages/Subjects/SubjectList'));
const Fees = lazy(() => import('./pages/Academic/Fees'));
const Events = lazy(() => import('./pages/Academic/Events'));
const Notices = lazy(() => import('./pages/Communication/Notices'));
const Reports = lazy(() => import('./pages/Administration/Reports'));
const Settings = lazy(() => import('./pages/Administration/Settings'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminTeachers = lazy(() => import('./pages/Admin/AdminTeachers'));
const AdminBroadcast = lazy(() => import('./pages/Admin/AdminBroadcast'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings'));
const AdminProfile = lazy(() => import('./pages/Admin/AdminProfile'));
const GlobalStudents = lazy(() => import('./pages/Admin/GlobalStudents'));
const AdminFinance = lazy(() => import('./pages/Admin/AdminFinance'));
const AdminReports = lazy(() => import('./pages/Admin/AdminReports'));

// Loading Screen
const LoadingScreen = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
      </div>
    </div>
    <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Initializing EduSync...</p>
  </div>
);

function App() {
  const { setUser, setLoading, fetchProfile } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchProfile(user.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, fetchProfile]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Landing / Login */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            } 
          />
          
          {/* Teacher Academic Workspace */}
          <Route 
            element={
              <TeacherRoute>
                <AppShell />
              </TeacherRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/results" element={<Results />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/events" element={<Events />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Admin Command Center */}
          <Route
            element={
              <AdminRoute>
                <AdminAppShell />
              </AdminRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/teachers" element={<AdminTeachers />} />
            <Route path="/admin/students" element={<GlobalStudents />} />
            <Route path="/admin/finance" element={<AdminFinance />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/broadcasts" element={<AdminBroadcast />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Global Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

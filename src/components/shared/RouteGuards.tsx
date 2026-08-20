import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// ─── Helper: Redirect to correct dashboard based on role ────
function useRoleRedirect(allowedRole: string) {
  const { user, role, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/', { replace: true });
      } else if (role && role !== allowedRole) {
        // Redirect to the correct dashboard for their actual role
        switch (role) {
          case 'admin':
            navigate('/admin', { replace: true });
            break;
          case 'teacher':
            navigate('/dashboard', { replace: true });
            break;
          case 'account_manager':
            navigate('/account', { replace: true });
            break;
          case 'student':
            navigate('/student', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      }
    }
  }, [user, role, isLoading, navigate, allowedRole]);

  return { user, role, isLoading };
}

// ─── Admin Route Guard ──────────────────────────────────────
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isLoading } = useRoleRedirect('admin');

  if (isLoading) return <LoadingSpinner />;
  return user && role === 'admin' ? <>{children}</> : null;
};

// ─── Teacher Route Guard ────────────────────────────────────
export const TeacherRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isLoading } = useRoleRedirect('teacher');

  if (isLoading) return <LoadingSpinner />;
  return user && role === 'teacher' ? <>{children}</> : null;
};

// ─── Account Manager Route Guard ────────────────────────────
export const AccountManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isLoading } = useRoleRedirect('account_manager');

  if (isLoading) return <LoadingSpinner />;
  return user && role === 'account_manager' ? <>{children}</> : null;
};

// ─── Student Route Guard ────────────────────────────────────
export const StudentRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isLoading } = useRoleRedirect('student');

  if (isLoading) return <LoadingSpinner />;
  return user && role === 'student' ? <>{children}</> : null;
};

// ─── Public Route (Login Page) ──────────────────────────────
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we have a user AND we know their role
    if (!isLoading && user && role) {
      switch (role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'teacher':
          navigate('/dashboard', { replace: true });
          break;
        case 'account_manager':
          navigate('/account', { replace: true });
          break;
        case 'student':
          navigate('/student', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
      }
    }
  }, [user, role, isLoading, navigate]);

  // If loading or if we have a user but don't know their role yet, show spinner
  if (isLoading || (user && !role)) return <LoadingSpinner />;

  return !user ? <>{children}</> : null;
};

// ─── Loading Spinner ────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  </div>
);

// Deprecated: Replaced by role-specific routes
export const ProtectedRoute = TeacherRoute;

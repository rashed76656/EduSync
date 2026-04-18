import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/', { replace: true });
      } else if (role === 'teacher') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, role, isLoading, navigate]);

  if (isLoading) return <LoadingSpinner />;

  return user && role === 'admin' ? <>{children}</> : null;
};

export const TeacherRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/', { replace: true });
      } else if (role === 'admin') {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, role, isLoading, navigate]);

  if (isLoading) return <LoadingSpinner />;

  return user && role === 'teacher' ? <>{children}</> : null;
};

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we have a user AND we know their role
    if (!isLoading && user && role) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, role, isLoading, navigate]);

  // If loading or if we have a user but don't know their role yet, show spinner
  if (isLoading || (user && !role)) return <LoadingSpinner />;

  return !user ? <>{children}</> : null;
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  </div>
);

// Deprecated: Replaced by role-specific routes
export const ProtectedRoute = TeacherRoute;

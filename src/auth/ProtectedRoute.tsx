import { Navigate, Outlet } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from './useAuth';

export default function ProtectedRoute() {
  const { authState } = useAuth();

  if (authState.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b12]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

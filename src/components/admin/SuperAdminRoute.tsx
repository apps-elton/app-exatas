import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-poppins">Carregando painel admin...</p>
        </div>
      </div>
    );
  }

  if (profile?.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

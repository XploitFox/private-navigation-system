import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { AuthService } from '../services/authService';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { accessToken } = await AuthService.refreshToken();
        setSession(accessToken);
      } catch {
        // Ignore missing or expired sessions on app startup.
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [setSession]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};

import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { AuthService } from '../services/authService';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to refresh token
        const { accessToken } = await AuthService.refreshToken();
        setAccessToken(accessToken);
        
        // If successful, get user profile
        const { user } = await AuthService.getProfile();
        setAuth(user, accessToken);
      } catch {
        // Failed to restore session (not logged in or expired)
        // No action needed, user remains unauthenticated
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setAuth, setAccessToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};

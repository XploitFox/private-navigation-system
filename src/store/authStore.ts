import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  setSession: (accessToken) => set({ accessToken, isAuthenticated: true }),
  logout: () => set({ accessToken: null, isAuthenticated: false }),
}));

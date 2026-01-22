import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSession, getSession, signOut as serverSignOut } from '@/app/actions/auth';

interface AuthState {
  session: UserSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  setSession: (session: UserSession | null) => void;
  fetchSession: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      isAuthenticated: false,
      loading: true,
      error: null,

      setSession: (session) =>
        set({ session, isAuthenticated: !!session }),

      fetchSession: async () => {
        set({ loading: true, error: null });
        try {
          const session = await getSession();
          set({
            session,
            isAuthenticated: !!session,
            loading: false
          });
        } catch (error) {
          set({
            session: null,
            isAuthenticated: false,
            loading: false,
            error: 'Failed to fetch session'
          });
        }
      },

      signOut: async () => {
        try {
          await serverSignOut();
          set({ session: null, isAuthenticated: false });
        } catch (error) {
          set({ error: 'Failed to sign out' });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

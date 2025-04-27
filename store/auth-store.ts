import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
  setUser: (user: any | null) => void;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  setUser: (user) => set({ user }),
  register: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    set({ loading: false, error: error ? error.message : null });
    if (!error) set({ user: data.user });
  },
  login: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false, error: error ? error.message : null });
    if (!error) set({ user: data.user });
  },
  logout: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signOut();
    // Also clear the user store to ensure unified logout
    try {
      const { clearUser } = require('./user-store');
      if (typeof clearUser === 'function') {
        clearUser();
      } else if (clearUser && clearUser.default) {
        clearUser.default();
      }
    } catch (e) {
      // Fallback: direct import may fail in some bundlers, so ignore
    }
    set({ loading: false, user: null, error: error ? error.message : null });
  },
  checkSession: async () => {
    set({ loading: true });
    const { data, error } = await supabase.auth.getUser();
    set({ user: data?.user ?? null, loading: false, error: error ? error.message : null });
  },
}));

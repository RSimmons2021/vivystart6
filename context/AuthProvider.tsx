import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useUserStore } from '@/store/user-store';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext<ReturnType<typeof useAuthStore> | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthStore();
  const { fetchUser } = useUserStore();

  useEffect(() => {
    auth.checkSession();
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      auth.setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchUser(session.user.id);
      }
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // Also fetch user profile if auth.user changes (covers initial mount)
  useEffect(() => {
    if (auth.user?.id) {
      fetchUser(auth.user.id);
    }
  }, [auth.user?.id]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

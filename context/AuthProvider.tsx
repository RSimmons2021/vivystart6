import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useUserStore } from '@/store/user-store';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext<ReturnType<typeof useAuthStore> | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthStore();
  const { fetchUser } = useUserStore();

  useEffect(() => {
    console.log('[AuthProvider] Running checkSession on mount');
    auth.checkSession();
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthProvider] onAuthStateChange event:', event, 'session:', session);
      auth.setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchUser(session.user.id);
      }
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // Also fetch user profile if auth.user changes (covers initial mount)
  useEffect(() => {
    console.log('[AuthProvider] auth.user changed:', auth.user);
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

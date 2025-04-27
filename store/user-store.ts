import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface UserState {
  user: User | null;
  isOnboarded: boolean;
  weightUnit: 'lbs' | 'kg';
  setUser: (user: User) => void;
  updateUser: (userData: Partial<User>) => void;
  setOnboarded: (value: boolean) => void;
  clearUser: () => void;
  toggleWeightUnit: () => void;
  fetchUser: (user_id: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isOnboarded: false,
      weightUnit: 'lbs',
      setUser: async (user) => {
        try {
          const { data, error } = await supabase
            .from('users')
            .upsert([user], { onConflict: 'id' });
          if (error) throw error;
          if (data) set({ user: data[0] });
        } catch (e) { set({ user }); }
      },
      updateUser: async (userData) => {
        const user = get().user;
        if (!user?.id) return;
        try {
          const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', user.id)
            .select()
            .single();
          if (error) throw error;
          if (data) set({ user: data });
        } catch (e) { set((state) => ({ user: state.user ? { ...state.user, ...userData } : null })); }
      },
      setOnboarded: (value) => set({ isOnboarded: value }),
      clearUser: () => set({ user: null }),
      toggleWeightUnit: () => set((state) => ({ 
        weightUnit: state.weightUnit === 'lbs' ? 'kg' : 'lbs' 
      })),
      fetchUser: async (user_id) => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user_id)
            .single();
          if (error) throw error;
          if (data) set({ user: data });
        } catch (e) { /* handle error */ }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
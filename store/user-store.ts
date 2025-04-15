import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

interface UserState {
  user: User | null;
  isOnboarded: boolean;
  weightUnit: 'lbs' | 'kg';
  setUser: (user: User) => void;
  updateUser: (userData: Partial<User>) => void;
  setOnboarded: (value: boolean) => void;
  clearUser: () => void;
  toggleWeightUnit: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isOnboarded: false,
      weightUnit: 'lbs', // Default to lbs
      setUser: (user) => set({ user }),
      updateUser: (userData) => 
        set((state) => ({ 
          user: state.user ? { ...state.user, ...userData } : null 
        })),
      setOnboarded: (value) => set({ isOnboarded: value }),
      clearUser: () => set({ user: null }),
      toggleWeightUnit: () => set((state) => ({ 
        weightUnit: state.weightUnit === 'lbs' ? 'kg' : 'lbs' 
      })),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
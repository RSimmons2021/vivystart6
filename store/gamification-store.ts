import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, Challenge, Streak } from '@/types';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface GamificationState {
  points: number;
  level: number;
  achievements: Achievement[];
  challenges: Challenge[];
  streaks: Streak;
  
  // Points and level methods
  addPoints: (points: number) => void;
  calculateLevel: (points: number) => number;
  
  // Achievement methods
  unlockAchievement: (achievement_id: string, user_id: string) => void;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  
  // Challenge methods
  addChallenge: (challenge: Omit<Challenge, 'id'>) => void;
  updateChallengeProgress: (id: string, progress: number) => void;
  completeChallenge: (id: string) => void;
  getActiveWeeklyChallenges: () => Challenge[];
  
  // Streak methods
  fetchStreaks: (user_id: string) => Promise<void>;
  updateStreaks: (streakData: Partial<Streak>) => Promise<void>;
  incrementStreak: (type: keyof Streak) => Promise<void>;
  resetStreak: (type: keyof Streak) => Promise<void>;
  updateLoginStreak: () => void;
  fetchAchievements: (user_id: string) => Promise<void>;
  fetchChallenges: (user_id: string) => Promise<void>;
  checkAchievementsAndChallenges: (type: 'weight' | 'steps' | 'protein' | 'fruits' | 'shots', value: number, userId: string) => void;
}

// Default achievements
const defaultAchievements: Achievement[] = [
  {
    id: 'first-weight-log',
    title: 'First Step',
    description: 'Log your weight for the first time',
    icon: 'scale',
    isUnlocked: false,
    category: 'weight',
    points: 10
  },
  {
    id: 'weight-streak-7',
    title: 'Weight Watcher',
    description: 'Log your weight for 7 consecutive days',
    icon: 'trending-up',
    isUnlocked: false,
    category: 'streak',
    points: 25
  },
  {
    id: 'first-meal-log',
    title: 'Food Tracker',
    description: 'Log your first meal',
    icon: 'utensils',
    isUnlocked: false,
    category: 'nutrition',
    points: 10
  },
  {
    id: 'protein-goal-5',
    title: 'Protein Pro',
    description: 'Meet your protein goal for 5 days',
    icon: 'egg',
    isUnlocked: false,
    category: 'nutrition',
    points: 20
  },
  {
    id: 'steps-10k',
    title: 'Step Master',
    description: 'Reach 10,000 steps in a day',
    icon: 'footprints',
    isUnlocked: false,
    category: 'activity',
    points: 15
  },
  {
    id: 'first-shot',
    title: 'First Shot',
    description: 'Log your first medication shot',
    icon: 'syringe',
    isUnlocked: false,
    category: 'medication',
    points: 10
  },
  {
    id: 'complete-stage',
    title: 'Journey Begins',
    description: 'Complete your first journey stage',
    icon: 'mountain',
    isUnlocked: false,
    category: 'journey',
    points: 30
  },
  {
    id: 'complete-all-stages',
    title: 'Summit Reached',
    description: 'Complete all journey stages',
    icon: 'flag',
    isUnlocked: false,
    category: 'journey',
    points: 100
  },
  {
    id: 'login-streak-7',
    title: 'Dedicated Tracker',
    description: 'Log in for 7 consecutive days',
    icon: 'calendar-check',
    isUnlocked: false,
    category: 'streak',
    points: 25
  },
  {
    id: 'first-goal-complete',
    title: 'Goal Getter',
    description: 'Complete your first goal',
    icon: 'target',
    isUnlocked: false,
    category: 'weight',
    points: 20
  },
  {
    id: 'weight-loss-5',
    title: 'Progress Milestone',
    description: 'Lose 5 pounds from your starting weight',
    icon: 'trending-down',
    isUnlocked: false,
    category: 'weight',
    points: 50
  },
  {
    id: 'weight-loss-10',
    title: 'Major Progress',
    description: 'Lose 10 pounds from your starting weight',
    icon: 'award',
    isUnlocked: false,
    category: 'weight',
    points: 100
  }
];

// Weekly challenges
const generateWeeklyChallenges = (): Challenge[] => {
  const today = new Date();
  const startDate = format(today, 'yyyy-MM-dd');
  const endDate = format(new Date(today.setDate(today.getDate() + 7)), 'yyyy-MM-dd');
  
  return [
    {
      id: `protein-week-${startDate}`,
      title: 'Protein Power',
      description: 'Meet your daily protein goal 5 times this week',
      startDate,
      endDate,
      isCompleted: false,
      progress: 0,
      category: 'nutrition',
      reward: 50
    },
    {
      id: `steps-week-${startDate}`,
      title: 'Step Challenge',
      description: 'Reach 8,000 steps at least 4 days this week',
      startDate,
      endDate,
      isCompleted: false,
      progress: 0,
      category: 'activity',
      reward: 50
    },
    {
      id: `fruits-week-${startDate}`,
      title: 'Fruits & Veggies',
      description: 'Log at least 4 servings of fruits and vegetables daily for 5 days',
      startDate,
      endDate,
      isCompleted: false,
      progress: 0,
      category: 'nutrition',
      reward: 50
    }
  ];
};

// Helper: map DB achievement to frontend Achievement
function mapAchievement(row: any): Achievement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    isUnlocked: row.is_unlocked ?? row.isUnlocked,
    unlockedAt: row.unlocked_at ?? row.unlockedAt,
    category: row.category,
    points: row.points,
  };
}

// Helper: map DB challenge to frontend Challenge
function mapChallenge(row: any): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.start_date ?? row.startDate,
    endDate: row.end_date ?? row.endDate,
    isCompleted: row.is_completed ?? row.isCompleted,
    progress: row.progress,
    category: row.category,
    reward: row.reward,
  };
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      points: 0,
      level: 1,
      achievements: defaultAchievements,
      challenges: generateWeeklyChallenges(),
      streaks: {
        weight: 0,
        meals: 0,
        steps: 0,
        water: 0,
        shots: 0,
        login: 0
      },
      
      // Points and level methods
      addPoints: (points) => {
        set((state) => {
          const newPoints = state.points + points;
          const newLevel = get().calculateLevel(newPoints);
          return { 
            points: newPoints,
            level: newLevel
          };
        });
      },
      
      calculateLevel: (points) => {
        // Simple level calculation: level = 1 + points/100
        return Math.floor(1 + points / 100);
      },
      
      // Achievement methods
      unlockAchievement: async (achievement_id, user_id) => {
        try {
          const { error } = await supabase
            .from('achievements')
            .update({ isUnlocked: true, unlockedAt: new Date().toISOString() })
            .eq('id', achievement_id)
            .eq('user_id', user_id);
          if (error) throw error;
          set((state) => ({
            achievements: state.achievements.map(a =>
              a.id === achievement_id
                ? { ...a, isUnlocked: true, unlockedAt: new Date().toISOString() }
                : a
            )
          }));
          // Award points for achievement
          const ach = get().achievements.find(a => a.id === achievement_id);
          if (ach) get().addPoints(ach.points);
          // Always refresh achievements from Supabase to sync state
          await get().fetchAchievements(user_id);
        } catch (e) { /* handle error */ }
      },
      
      getUnlockedAchievements: () => {
        return get().achievements.filter(a => a.isUnlocked);
      },
      
      getLockedAchievements: () => {
        return get().achievements.filter(a => !a.isUnlocked);
      },
      
      // Challenge methods
      addChallenge: (challenge) => {
        const newChallenge = { ...challenge, id: Date.now().toString() };
        set((state) => ({
          challenges: [...state.challenges, newChallenge]
        }));
      },
      
      updateChallengeProgress: (id, progress) => {
        set((state) => ({
          challenges: state.challenges.map(c => 
            c.id === id 
              ? { 
                  ...c, 
                  progress,
                  isCompleted: progress >= 100
                } 
              : c
          )
        }));
        
        // If challenge is completed, award points
        const challenge = get().challenges.find(c => c.id === id);
        if (challenge && progress >= 100 && !challenge.isCompleted) {
          get().addPoints(challenge.reward);
        }
      },
      
      completeChallenge: (id) => {
        set((state) => ({
          challenges: state.challenges.map(c => 
            c.id === id ? { ...c, isCompleted: true, progress: 100 } : c
          )
        }));
        
        // Award points for completing challenge
        const challenge = get().challenges.find(c => c.id === id);
        if (challenge && !challenge.isCompleted) {
          get().addPoints(challenge.reward);
        }
      },
      
      getActiveWeeklyChallenges: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().challenges.filter(c => 
          c.startDate <= today && c.endDate >= today && !c.isCompleted
        );
      },
      
      // Streak methods
      fetchStreaks: async (user_id) => {
        try {
          const { data, error } = await supabase
            .from('streaks')
            .select('*')
            .eq('user_id', user_id)
            .single();
          if (error) throw error;
          if (data) set({ streaks: data });
        } catch (e) { /* handle error */ }
      },
      updateStreaks: async (streakData) => {
        // Get user_id from user store
        const user = require('./user-store').useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const res = await supabase
            .from('streaks')
            .update({ ...streakData })
            .eq('user_id', user.id);
          // Optionally, fetch the updated streaks
          await get().fetchStreaks(user.id);
        } catch (e) { /* handle error */ }
      },
      incrementStreak: async (type) => {
        const { streaks } = get();
        const updated = { ...streaks, [type]: Number(streaks[type] || 0) + 1 };
        await get().updateStreaks(updated);
      },
      resetStreak: async (type) => {
        const { streaks } = get();
        const updated = { ...streaks, [type]: 0 };
        await get().updateStreaks(updated);
      },
      
      updateLoginStreak: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { lastLoginDate } = get().streaks;
        
        if (!lastLoginDate) {
          // First login
          set((state) => ({
            streaks: {
              ...state.streaks,
              login: 1,
              lastLoginDate: today
            }
          }));
        } else if (lastLoginDate !== today) {
          // Check if consecutive day
          const lastDate = new Date(lastLoginDate);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Consecutive day
            get().incrementStreak('login');
          } else if (diffDays > 1) {
            // Streak broken
            get().resetStreak('login');
          }
          
          // Update last login date
          set((state) => ({
            streaks: {
              ...state.streaks,
              lastLoginDate: today
            }
          }));
        }
      },
      fetchAchievements: async (user_id) => {
        try {
          const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', user_id);
          if (error) throw error;
          if (data && data.length > 0) {
            set({ achievements: data.map(mapAchievement) });
          } else {
            set({ achievements: defaultAchievements });
          }
        } catch (e) { /* handle error */ }
      },
      fetchChallenges: async (user_id) => {
        try {
          const { data, error } = await supabase
            .from('challenges')
            .select('*')
            .eq('user_id', user_id);
          if (error) throw error;
          if (data) set({ challenges: data.map(mapChallenge) });
        } catch (e) { /* handle error */ }
      },
      checkAchievementsAndChallenges: (type, value, userId) => {
        const { achievements, unlockAchievement, challenges, updateChallengeProgress, completeChallenge } = get();

        if (type === 'shots') {
          const firstShot = achievements.find(a => a.id === 'first-shot');
          if (firstShot && !firstShot.isUnlocked) unlockAchievement(firstShot.id, userId);
        }
        // --- Achievements ---
        if (type === 'weight') {
          const firstWeight = achievements.find(a => a.id === 'first-weight-log');
          if (firstWeight && !firstWeight.isUnlocked) {
            unlockAchievement(firstWeight.id, userId);
          }
          // Example: Weight streak or loss could be checked here
        }
        if (type === 'protein') {
          const proteinPro = achievements.find(a => a.id === 'protein-goal-5');
          if (proteinPro && !proteinPro.isUnlocked && value >= /* your protein goal */ 50) {
            unlockAchievement(proteinPro.id, userId);
          }
        }
        if (type === 'steps') {
          const stepMaster = achievements.find(a => a.id === 'steps-10k');
          if (stepMaster && !stepMaster.isUnlocked && value >= 10000) {
            unlockAchievement(stepMaster.id, userId);
          }
        }
        if (type === 'fruits') {
          // Example: Unlock after logging fruits/veggies X times
        }

        // --- Challenges ---
        challenges.forEach(challenge => {
          if (challenge.category === type) {
            // Example: increment progress based on value
            let progress = challenge.progress;
            if (type === 'steps' && value >= 8000) progress += 25; // e.g., 4 days of 8k steps = 100%
            if (type === 'protein' && value >= 50) progress += 20; // e.g., 5 days of protein goal = 100%
            if (type === 'fruits' && value >= 4) progress += 20; // e.g., 5 days of 4 servings = 100%
            if (progress >= 100 && !challenge.isCompleted) {
              completeChallenge(challenge.id);
            } else {
              updateChallengeProgress(challenge.id, Math.min(progress, 100));
            }
          }
        });
      }
    }),
    {
      name: 'gamification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
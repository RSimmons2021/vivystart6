import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, Challenge, Streak } from '@/types';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
  unlockAchievement: (achievement_code: string, user_id: string) => void;
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
    achievement_code: 'first-weight-log',
    title: 'First Step',
    description: 'Log your weight for the first time',
    icon: 'scale',
    is_unlocked: false,
    category: 'weight',
    points: 10
  },
  {
    achievement_code: 'weight-streak-7',
    title: 'Weight Watcher',
    description: 'Log your weight for 7 consecutive days',
    icon: 'trending-up',
    is_unlocked: false,
    category: 'streak',
    points: 25
  },
  {
    achievement_code: 'food-tracker',
    title: 'Food Tracker',
    description: 'Log your first meal',
    icon: 'utensils',
    is_unlocked: false,
    category: 'nutrition',
    points: 10
  },
  {
    achievement_code: 'protein-goal-5',
    title: 'Protein Pro',
    description: 'Meet your protein goal for 5 days',
    icon: 'egg',
    is_unlocked: false,
    category: 'nutrition',
    points: 20
  },
  {
    achievement_code: 'steps-10k',
    title: 'Step Master',
    description: 'Hit 10,000 steps in a day',
    icon: 'footprints',
    is_unlocked: false,
    category: 'activity',
    points: 20
  },
  {
    achievement_code: 'first-shot',
    title: 'First Shot',
    description: 'Log your first medication shot',
    icon: 'syringe',
    is_unlocked: false,
    category: 'medication',
    points: 10
  },
  {
    achievement_code: 'journey-begins',
    title: 'Journey Begins',
    description: 'Complete your first journey stage',
    icon: 'flag',
    is_unlocked: false,
    category: 'journey',
    points: 10
  },
  {
    achievement_code: 'summit-reached',
    title: 'Summit Reached',
    description: 'Complete all journey stages',
    icon: 'mountain',
    is_unlocked: false,
    category: 'journey',
    points: 30
  },
  {
    achievement_code: 'dedicated-tracker',
    title: 'Dedicated Tracker',
    description: 'Log any data 7 days in a row',
    icon: 'calendar-check',
    is_unlocked: false,
    category: 'streak',
    points: 25
  },
  {
    achievement_code: 'goal-getter',
    title: 'Goal Getter',
    description: 'Set your first weight goal',
    icon: 'target',
    is_unlocked: false,
    category: 'weight',
    points: 10
  },
  {
    achievement_code: 'progress-milestone',
    title: 'Progress Milestone',
    description: 'Lose your first 5 lbs',
    icon: 'star',
    is_unlocked: false,
    category: 'weight',
    points: 20
  },
  {
    achievement_code: 'major-progress',
    title: 'Major Progress',
    description: 'Lose 10% of your starting weight',
    icon: 'award',
    is_unlocked: false,
    category: 'weight',
    points: 30
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
    achievement_code: row.achievement_code,
    title: row.title,
    description: row.description,
    icon: row.icon,
    is_unlocked: row.is_unlocked,
    unlocked_at: row.unlocked_at,
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
    startDate: row.start_date,
    endDate: row.end_date,
    isCompleted: row.is_completed,
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
      unlockAchievement: async (achievement_code, user_id) => {
        try {
          // Try to update
          const { data, error, count } = await supabase
            .from('achievements')
            .update({ is_unlocked: true, unlocked_at: new Date().toISOString() })
            .eq('achievement_code', achievement_code)
            .eq('user_id', user_id)
            .select('*', { count: 'exact' });
          if (error) {
            console.error('unlockAchievement update error:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
              full: error
            });
            throw error;
          }
          // If no rows updated, insert new row
          if (count === 0 || (data && data.length === 0)) {
            // Find the default achievement definition
            const defaultAch = defaultAchievements.find(a => a.achievement_code === achievement_code);
            if (defaultAch) {
              const { error: insertError } = await supabase
                .from('achievements')
                .insert({
                  user_id,
                  ...defaultAch,
                  is_unlocked: true,
                  unlocked_at: new Date().toISOString()
                });
              if (insertError) {
                console.error('unlockAchievement insert error:', {
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                  code: insertError.code,
                  full: insertError
                });
                throw insertError;
              }
            } else {
              console.error('unlockAchievement: Default achievement not found for', achievement_code);
            }
          }
          set((state) => ({
            achievements: state.achievements.map(a =>
              a.achievement_code === achievement_code
                ? { ...a, is_unlocked: true, unlocked_at: new Date().toISOString() }
                : a
            )
          }));
          // Award points for achievement
          const ach = get().achievements.find(a => a.achievement_code === achievement_code);
          if (ach) get().addPoints(ach.points);
          // Always refresh achievements from Supabase to sync state
          await get().fetchAchievements(user_id);
        } catch (e) {
          if (e && typeof e === 'object') {
            console.error('unlockAchievement error:', JSON.stringify(e, null, 2));
          } else {
            console.error('unlockAchievement error:', e);
          }
        }
      },
      
      getUnlockedAchievements: () => {
        return get().achievements.filter(a => a.is_unlocked);
      },
      
      getLockedAchievements: () => {
        return get().achievements.filter(a => !a.is_unlocked);
      },
      
      // Challenge methods
      addChallenge: (challenge) => {
        const newChallenge = { ...challenge, id: uuidv4() };
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
          // Merge Supabase achievements with defaultAchievements
          const unlockedMap = new Map(
            (data || []).map((a: any) => [a.achievement_code, a])
          );
          const merged = defaultAchievements.map((def) => {
            const unlocked = unlockedMap.get(def.achievement_code);
            return unlocked
              ? { ...def, ...unlocked, is_unlocked: unlocked.is_unlocked, unlocked_at: unlocked.unlocked_at }
              : { ...def, is_unlocked: false, unlocked_at: null };
          });
          set({ achievements: merged });
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
      checkAchievementsAndChallenges: async (type, value, userId) => {
        const { achievements, unlockAchievement, challenges, updateChallengeProgress, completeChallenge } = get();
        try {
          if (type === 'shots') {
            const firstShot = achievements.find(a => a.achievement_code === 'first-shot');
            if (firstShot && !firstShot.is_unlocked) await unlockAchievement(firstShot.achievement_code, userId);
          }
          // --- Achievements ---
          if (type === 'weight') {
            const firstWeight = achievements.find(a => a.achievement_code === 'first-weight-log');
            if (firstWeight && !firstWeight.is_unlocked) {
              await unlockAchievement(firstWeight.achievement_code, userId);
            }
            // Example: Weight streak or loss could be checked here
          }
          if (type === 'protein') {
            const proteinPro = achievements.find(a => a.achievement_code === 'protein-goal-5');
            if (proteinPro && !proteinPro.is_unlocked && value >= 50) {
              await unlockAchievement(proteinPro.achievement_code, userId);
            }
          }
          if (type === 'steps') {
            const stepMaster = achievements.find(a => a.achievement_code === 'steps-10k');
            if (stepMaster && !stepMaster.is_unlocked && value >= 10000) {
              await unlockAchievement(stepMaster.achievement_code, userId);
            }
          }
          if (type === 'fruits') {
            // Example: Unlock after logging fruits/veggies X times
          }

          // --- Challenges ---
          for (const challenge of challenges) {
            if (challenge.category === type) {
              let progress = challenge.progress;
              if (type === 'steps' && value >= 8000) progress += 25;
              if (type === 'protein' && value >= 50) progress += 20;
              if (type === 'fruits' && value >= 4) progress += 20;
              if (progress >= 100 && !challenge.isCompleted) {
                completeChallenge(challenge.id);
              } else {
                updateChallengeProgress(challenge.id, Math.min(progress, 100));
              }
            }
          }
        } catch (e) {
          console.error('checkAchievementsAndChallenges error:', e);
        }
      }
    }),
    {
      name: 'gamification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
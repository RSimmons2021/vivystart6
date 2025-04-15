import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, Challenge, Streak } from '@/types';
import { format } from 'date-fns';

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
  unlockAchievement: (id: string) => void;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  
  // Challenge methods
  addChallenge: (challenge: Omit<Challenge, 'id'>) => void;
  updateChallengeProgress: (id: string, progress: number) => void;
  completeChallenge: (id: string) => void;
  getActiveWeeklyChallenges: () => Challenge[];
  
  // Streak methods
  incrementStreak: (type: keyof Streak) => void;
  resetStreak: (type: keyof Streak) => void;
  updateLoginStreak: () => void;
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
      unlockAchievement: (id) => {
        const achievement = get().achievements.find(a => a.id === id);
        
        if (achievement && !achievement.isUnlocked) {
          set((state) => ({
            achievements: state.achievements.map(a => 
              a.id === id 
                ? { ...a, isUnlocked: true, unlockedAt: new Date().toISOString() } 
                : a
            )
          }));
          
          // Add points for unlocking achievement
          get().addPoints(achievement.points);
        }
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
      incrementStreak: (type) => {
        set((state) => ({
          streaks: {
            ...state.streaks,
            [type]: state.streaks[type] + 1
          }
        }));
        
        // Check for streak achievements
        const streakValue = get().streaks[type] + 1;
        
        if (type === 'weight' && streakValue === 7) {
          get().unlockAchievement('weight-streak-7');
        }
        
        if (type === 'login' && streakValue === 7) {
          get().unlockAchievement('login-streak-7');
        }
      },
      
      resetStreak: (type) => {
        set((state) => ({
          streaks: {
            ...state.streaks,
            [type]: 0
          }
        }));
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
      }
    }),
    {
      name: 'gamification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
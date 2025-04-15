import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JourneyStage, Goal } from '@/types';

interface JourneyState {
  journeyStages: JourneyStage[];
  goals: Goal[];
  
  // Journey methods
  addJourneyStage: (stage: Omit<JourneyStage, 'id'>) => void;
  updateJourneyStage: (id: string, data: Partial<JourneyStage>) => void;
  completeJourneyStage: (id: string) => void;
  
  // Goal methods
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  completeGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  updateGoalProgress: (id: string, progress: number) => void;
}

// Default journey stages
const defaultJourneyStages: Omit<JourneyStage, 'id'>[] = [
  {
    title: 'GLP-1 Foundations',
    description: 'Learn the basics of GLP-1 medications and how they work.',
    isCompleted: false,
    order: 1
  },
  {
    title: 'Side Effects',
    description: 'Understand potential side effects and how to manage them.',
    isCompleted: false,
    order: 2
  },
  {
    title: 'Best Practices',
    description: 'Discover best practices for diet, exercise, and lifestyle.',
    isCompleted: false,
    order: 3
  },
  {
    title: 'Navigating Obstacles',
    description: 'Learn strategies for overcoming common challenges.',
    isCompleted: false,
    order: 4
  },
  {
    title: 'Sustainable Success',
    description: 'Build habits for long-term success and weight maintenance.',
    isCompleted: false,
    order: 5
  }
];

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      journeyStages: defaultJourneyStages.map(stage => ({
        ...stage,
        id: `stage-${stage.order}`
      })),
      goals: [],
      
      // Journey methods
      addJourneyStage: (stage) => {
        const newStage = { ...stage, id: Date.now().toString() };
        set((state) => ({ 
          journeyStages: [...state.journeyStages, newStage] 
        }));
      },
      
      updateJourneyStage: (id, data) => {
        set((state) => ({
          journeyStages: state.journeyStages.map((stage) => 
            stage.id === id ? { ...stage, ...data } : stage
          )
        }));
      },
      
      completeJourneyStage: (id) => {
        set((state) => ({
          journeyStages: state.journeyStages.map((stage) => 
            stage.id === id ? { ...stage, isCompleted: true } : stage
          )
        }));
      },
      
      // Goal methods
      addGoal: (goal) => {
        const newGoal = { ...goal, id: Date.now().toString() };
        set((state) => ({ 
          goals: [...state.goals, newGoal] 
        }));
      },
      
      updateGoal: (id, data) => {
        set((state) => ({
          goals: state.goals.map((goal) => 
            goal.id === id ? { ...goal, ...data } : goal
          )
        }));
      },
      
      completeGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((goal) => 
            goal.id === id ? { ...goal, isCompleted: true, progress: 100 } : goal
          )
        }));
      },
      
      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id)
        }));
      },
      
      updateGoalProgress: (id, progress) => {
        set((state) => ({
          goals: state.goals.map((goal) => 
            goal.id === id 
              ? { 
                  ...goal, 
                  progress, 
                  isCompleted: progress >= 100 
                } 
              : goal
          )
        }));
      }
    }),
    {
      name: 'journey-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
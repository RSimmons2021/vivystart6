import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  WeightLog, 
  Shot, 
  SideEffect, 
  Meal, 
  WaterLog, 
  StepLog, 
  DailyLog,
  WeeklyScore
} from '@/types';
import { format } from 'date-fns';

interface HealthState {
  weightLogs: WeightLog[];
  shots: Shot[];
  sideEffects: SideEffect[];
  meals: Meal[];
  savedMeals: Meal[];
  waterLogs: WaterLog[];
  stepLogs: StepLog[];
  dailyLogs: DailyLog[];
  
  // Weight methods
  addWeightLog: (log: Omit<WeightLog, 'id'>) => void;
  updateWeightLog: (id: string, data: Partial<WeightLog>) => void;
  deleteWeightLog: (id: string) => void;
  
  // Shot methods
  addShot: (shot: Omit<Shot, 'id'>) => void;
  updateShot: (id: string, data: Partial<Shot>) => void;
  deleteShot: (id: string) => void;
  
  // Side effect methods
  addSideEffect: (effect: Omit<SideEffect, 'id'>) => void;
  updateSideEffect: (id: string, data: Partial<SideEffect>) => void;
  deleteSideEffect: (id: string) => void;
  
  // Meal methods
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  updateMeal: (id: string, data: Partial<Meal>) => void;
  deleteMeal: (id: string) => void;
  saveMeal: (id: string) => void;
  unsaveMeal: (id: string) => void;
  
  // Water methods
  addWaterLog: (log: Omit<WaterLog, 'id'>) => void;
  updateWaterLog: (id: string, data: Partial<WaterLog>) => void;
  
  // Step methods
  addStepLog: (log: Omit<StepLog, 'id'>) => void;
  updateStepLog: (id: string, data: Partial<StepLog>) => void;
  
  // Daily log methods
  getDailyLog: (date: string) => DailyLog | undefined;
  updateDailyLog: (date: string, data: Partial<Omit<DailyLog, 'id' | 'date'>>) => void;
  
  // Calculations
  getWeeklyScore: (startDate: string, endDate: string) => WeeklyScore;
  getWeightLoss: () => { total: number; percentage: number };
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      weightLogs: [],
      shots: [],
      sideEffects: [],
      meals: [],
      savedMeals: [],
      waterLogs: [],
      stepLogs: [],
      dailyLogs: [],
      
      // Weight methods
      addWeightLog: (log) => {
        const newLog = { ...log, id: Date.now().toString() };
        set((state) => ({ 
          weightLogs: [...state.weightLogs, newLog] 
        }));
        
        // Update daily log if it exists
        const dailyLog = get().getDailyLog(log.date);
        if (dailyLog) {
          get().updateDailyLog(log.date, { weight: log.weight });
        }
      },
      
      updateWeightLog: (id, data) => {
        set((state) => ({
          weightLogs: state.weightLogs.map((log) => 
            log.id === id ? { ...log, ...data } : log
          )
        }));
        
        // Update daily log if date hasn't changed
        const updatedLog = get().weightLogs.find(log => log.id === id);
        if (updatedLog) {
          const dailyLog = get().getDailyLog(updatedLog.date);
          if (dailyLog && data.weight) {
            get().updateDailyLog(updatedLog.date, { weight: data.weight });
          }
        }
      },
      
      deleteWeightLog: (id) => {
        set((state) => ({
          weightLogs: state.weightLogs.filter((log) => log.id !== id)
        }));
      },
      
      // Shot methods
      addShot: (shot) => {
        const newShot = { ...shot, id: Date.now().toString() };
        set((state) => ({ 
          shots: [...state.shots, newShot] 
        }));
        
        // Update daily log
        const dailyLog = get().getDailyLog(shot.date);
        if (dailyLog) {
          get().updateDailyLog(shot.date, { shotTaken: true });
        }
      },
      
      updateShot: (id, data) => {
        set((state) => ({
          shots: state.shots.map((shot) => 
            shot.id === id ? { ...shot, ...data } : shot
          )
        }));
      },
      
      deleteShot: (id) => {
        set((state) => ({
          shots: state.shots.filter((shot) => shot.id !== id)
        }));
      },
      
      // Side effect methods
      addSideEffect: (effect) => {
        const newEffect = { ...effect, id: Date.now().toString() };
        set((state) => ({ 
          sideEffects: [...state.sideEffects, newEffect] 
        }));
        
        // Update daily log
        const dailyLog = get().getDailyLog(effect.date);
        if (dailyLog) {
          get().updateDailyLog(effect.date, { 
            sideEffects: [...dailyLog.sideEffects, newEffect] 
          });
        }
      },
      
      updateSideEffect: (id, data) => {
        set((state) => ({
          sideEffects: state.sideEffects.map((effect) => 
            effect.id === id ? { ...effect, ...data } : effect
          )
        }));
      },
      
      deleteSideEffect: (id) => {
        set((state) => ({
          sideEffects: state.sideEffects.filter((effect) => effect.id !== id)
        }));
        
        // Update daily logs
        set((state) => ({
          dailyLogs: state.dailyLogs.map(log => ({
            ...log,
            sideEffects: log.sideEffects.filter(effect => effect.id !== id)
          }))
        }));
      },
      
      // Meal methods
      addMeal: (meal) => {
        const newMeal = { ...meal, id: Date.now().toString() };
        set((state) => ({ 
          meals: [...state.meals, newMeal] 
        }));
        
        // Update daily log
        const dailyLog = get().getDailyLog(meal.date);
        if (dailyLog) {
          get().updateDailyLog(meal.date, { 
            meals: [...dailyLog.meals, newMeal] 
          });
        }
      },
      
      updateMeal: (id, data) => {
        set((state) => ({
          meals: state.meals.map((meal) => 
            meal.id === id ? { ...meal, ...data } : meal
          ),
          savedMeals: state.savedMeals.map((meal) => 
            meal.id === id ? { ...meal, ...data } : meal
          )
        }));
        
        // Update daily logs
        set((state) => ({
          dailyLogs: state.dailyLogs.map(log => ({
            ...log,
            meals: log.meals.map(meal => 
              meal.id === id ? { ...meal, ...data } : meal
            )
          }))
        }));
      },
      
      deleteMeal: (id) => {
        set((state) => ({
          meals: state.meals.filter((meal) => meal.id !== id)
        }));
        
        // Update daily logs
        set((state) => ({
          dailyLogs: state.dailyLogs.map(log => ({
            ...log,
            meals: log.meals.filter(meal => meal.id !== id)
          }))
        }));
      },
      
      saveMeal: (id) => {
        const mealToSave = get().meals.find(meal => meal.id === id);
        if (mealToSave && !get().savedMeals.some(meal => meal.id === id)) {
          set((state) => ({
            savedMeals: [...state.savedMeals, { ...mealToSave, isSaved: true }],
            meals: state.meals.map(meal => 
              meal.id === id ? { ...meal, isSaved: true } : meal
            )
          }));
        }
      },
      
      unsaveMeal: (id) => {
        set((state) => ({
          savedMeals: state.savedMeals.filter(meal => meal.id !== id),
          meals: state.meals.map(meal => 
            meal.id === id ? { ...meal, isSaved: false } : meal
          )
        }));
      },
      
      // Water methods
      addWaterLog: (log) => {
        const newLog = { ...log, id: Date.now().toString() };
        set((state) => ({ 
          waterLogs: [...state.waterLogs, newLog] 
        }));
        
        // Update daily log
        const dailyLog = get().getDailyLog(log.date);
        if (dailyLog) {
          const currentWater = dailyLog.waterOz || 0;
          get().updateDailyLog(log.date, { 
            waterOz: currentWater + log.amount 
          });
        } else {
          // Create new daily log
          const newDailyLog: DailyLog = {
            id: Date.now().toString(),
            date: log.date,
            fruitsVeggiesServings: 0,
            proteinGrams: 0,
            waterOz: log.amount,
            steps: 0,
            meals: [],
            sideEffects: []
          };
          set((state) => ({
            dailyLogs: [...state.dailyLogs, newDailyLog]
          }));
        }
      },
      
      updateWaterLog: (id, data) => {
        set((state) => ({
          waterLogs: state.waterLogs.map((log) => 
            log.id === id ? { ...log, ...data } : log
          )
        }));
      },
      
      // Step methods
      addStepLog: (log) => {
        const newLog = { ...log, id: Date.now().toString() };
        set((state) => ({ 
          stepLogs: [...state.stepLogs, newLog] 
        }));
        
        // Update daily log
        const dailyLog = get().getDailyLog(log.date);
        if (dailyLog) {
          get().updateDailyLog(log.date, { steps: log.count });
        } else {
          // Create new daily log
          const newDailyLog: DailyLog = {
            id: Date.now().toString(),
            date: log.date,
            fruitsVeggiesServings: 0,
            proteinGrams: 0,
            waterOz: 0,
            steps: log.count,
            meals: [],
            sideEffects: []
          };
          set((state) => ({
            dailyLogs: [...state.dailyLogs, newDailyLog]
          }));
        }
      },
      
      updateStepLog: (id, data) => {
        set((state) => ({
          stepLogs: state.stepLogs.map((log) => 
            log.id === id ? { ...log, ...data } : log
          )
        }));
      },
      
      // Daily log methods
      getDailyLog: (date) => {
        return get().dailyLogs.find(log => log.date === date);
      },
      
      updateDailyLog: (date, data) => {
        const existingLog = get().getDailyLog(date);
        
        if (existingLog) {
          // Update existing log
          set((state) => ({
            dailyLogs: state.dailyLogs.map((log) => 
              log.date === date ? { ...log, ...data } : log
            )
          }));
        } else {
          // Create new log
          const newLog: DailyLog = {
            id: Date.now().toString(),
            date,
            fruitsVeggiesServings: data.fruitsVeggiesServings || 0,
            proteinGrams: data.proteinGrams || 0,
            waterOz: data.waterOz || 0,
            steps: data.steps || 0,
            weight: data.weight,
            shotTaken: data.shotTaken || false,
            meals: data.meals || [],
            sideEffects: data.sideEffects || []
          };
          
          set((state) => ({
            dailyLogs: [...state.dailyLogs, newLog]
          }));
        }
      },
      
      // Calculations
      getWeeklyScore: (startDate, endDate) => {
        const relevantLogs = get().dailyLogs.filter(log => {
          return log.date >= startDate && log.date <= endDate;
        });
        
        if (relevantLogs.length === 0) {
          return { fruitsVeggies: 0, protein: 0, steps: 0, overall: 0 };
        }
        
        // Calculate averages
        const fruitsVeggiesTotal = relevantLogs.reduce((sum, log) => sum + log.fruitsVeggiesServings, 0);
        const proteinTotal = relevantLogs.reduce((sum, log) => sum + log.proteinGrams, 0);
        const stepsTotal = relevantLogs.reduce((sum, log) => sum + log.steps, 0);
        
        // Calculate scores (percentage of target)
        const fruitsVeggiesScore = Math.min(100, (fruitsVeggiesTotal / (5 * relevantLogs.length)) * 100);
        const proteinScore = Math.min(100, (proteinTotal / (100 * relevantLogs.length)) * 100);
        const stepsScore = Math.min(100, (stepsTotal / (10000 * relevantLogs.length)) * 100);
        
        // Overall score is average of the three
        const overall = Math.round((fruitsVeggiesScore + proteinScore + stepsScore) / 3);
        
        return {
          fruitsVeggies: Math.round(fruitsVeggiesScore),
          protein: Math.round(proteinScore),
          steps: Math.round(stepsScore),
          overall
        };
      },
      
      getWeightLoss: () => {
        // Use a safer approach that doesn't rely on importing the user store
        const startWeight = 200; // Default value
        
        const sortedLogs = [...get().weightLogs].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        const latestWeight = sortedLogs.length > 0 ? sortedLogs[0].weight : 190; // Default current weight
        
        const weightLoss = startWeight - latestWeight;
        const percentageLoss = (weightLoss / startWeight) * 100;
        
        return {
          total: parseFloat(weightLoss.toFixed(1)),
          percentage: parseFloat(percentageLoss.toFixed(1))
        };
      }
    }),
    {
      name: 'health-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
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
import { useUserStore } from './user-store';
import { supabase } from '@/lib/supabase';

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
  getDailyLog: (date: string) => Promise<DailyLog | undefined>;
  updateDailyLog: (date: string, data: Partial<Omit<DailyLog, 'id' | 'date'>>) => void;
  
  // Fetch methods
  fetchWeightLogs: () => void;
  fetchShots: () => void;
  fetchSideEffects: () => void;
  fetchWaterLogs: () => void;
  fetchStepLogs: () => void;
  fetchDailyLogs: () => void;
  
  // Calculations
  getWeeklyScore: (startDate: string, endDate: string) => WeeklyScore;
  getWeightLoss: () => { total: number; percentage: number };
  
  setShots: (shots: Shot[]) => void;
  setWeightLogs: (weightLogs: WeightLog[]) => void;
  setSideEffects: (sideEffects: SideEffect[]) => void;
}

function ensureString(val: string | undefined, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
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
      addWeightLog: async (log: Omit<WeightLog, 'id'>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const newLog = { ...log, date: ensureString(log.date), user_id: user.id };
          const { data, error } = await supabase
            .from('weight_logs')
            .insert([newLog]);
          if (error) throw error;
          const dataArr = data as unknown[];
          const maybeObj = dataArr[0];
          if (
            data &&
            Array.isArray(data) &&
            dataArr.length > 0 &&
            typeof maybeObj === 'object' &&
            maybeObj !== null &&
            !Array.isArray(maybeObj)
          ) {
            set((state) => ({ weightLogs: [...state.weightLogs, { ...(maybeObj as Record<string, any>), date: ensureString((maybeObj as Record<string, any>).date) }] }));
            // Optionally update daily log
            const dailyLog = await get().getDailyLog(newLog.date);
            if (dailyLog && typeof dailyLog === 'object' && dailyLog !== null) {
              await get().updateDailyLog(newLog.date, { weight: newLog.weight });
            }
          }
        } catch (e) { /* handle error */ }
      },
      updateWeightLog: async (id: string, data: Partial<WeightLog>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const updateData = { ...data, date: data.date ? ensureString(data.date) : undefined, user_id: user.id };
          const { error } = await supabase
            .from('weight_logs')
            .update([updateData]).eq('id', id);
          if (error) throw error;
          set((state) => ({ weightLogs: state.weightLogs.map(log => log.id === id ? { ...log, ...updateData, date: ensureString(updateData.date) } : log) }));
          if (updateData.weight && updateData.date) {
            const dailyLog = await get().getDailyLog(updateData.date);
            if (dailyLog && typeof dailyLog === 'object' && dailyLog !== null) {
              await get().updateDailyLog(updateData.date, { weight: updateData.weight });
            }
          }
        } catch (e) { /* handle error */ }
      },
      deleteWeightLog: async (id: string) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { error } = await supabase
            .from('weight_logs')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
          if (error) throw error;
          set((state) => ({
            weightLogs: state.weightLogs.filter((log) => log.id !== id)
          }));
        } catch (e) { /* handle error */ }
      },
      
      // Shot methods
      addShot: async (shot: Omit<Shot, 'id'>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const newShot = { ...shot, date: ensureString(shot.date), time: ensureString(shot.time), user_id: user.id };
          const { data, error } = await supabase
            .from('shots')
            .insert([newShot]);
          if (error) throw error;
          const dataArr = data as unknown[];
          const maybeObj = dataArr[0];
          if (
            data &&
            Array.isArray(data) &&
            dataArr.length > 0 &&
            typeof maybeObj === 'object' &&
            maybeObj !== null &&
            !Array.isArray(maybeObj)
          ) {
            set((state) => ({ shots: [...state.shots, { ...(maybeObj as Record<string, any>), date: ensureString((maybeObj as Record<string, any>).date), time: ensureString((maybeObj as Record<string, any>).time) }] }));
            // Optionally update daily log
            const dailyLog = await get().getDailyLog(newShot.date);
            if (dailyLog && typeof dailyLog === 'object' && dailyLog !== null) {
              await get().updateDailyLog(newShot.date, { shotTaken: true });
            }
          }
        } catch (e) { /* handle error */ }
      },
      updateShot: async (id: string, data: Partial<Shot>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const updateData = { ...data, date: data.date ? ensureString(data.date) : undefined, time: data.time ? ensureString(data.time) : undefined, user_id: user.id };
          const { error } = await supabase
            .from('shots')
            .update([updateData]).eq('id', id);
          if (error) throw error;
          set((state) => ({ shots: state.shots.map(shot => shot.id === id ? { ...shot, ...updateData, date: ensureString(updateData.date), time: ensureString(updateData.time) } : shot) }));
        } catch (e) { /* handle error */ }
      },
      deleteShot: async (id: string) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { error } = await supabase
            .from('shots')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
          if (error) throw error;
          set((state) => ({
            shots: state.shots.filter((shot) => shot.id !== id)
          }));
        } catch (e) { /* handle error */ }
      },
      
      // Side effect methods
      addSideEffect: async (effect: Omit<SideEffect, 'id'>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const newEffect = { ...effect, date: ensureString(effect.date), type: ensureString(effect.type), severity: effect.severity ?? 'mild', user_id: user.id };
          const { data, error } = await supabase
            .from('side_effects')
            .insert([newEffect]);
          if (error) throw error;
          const dataArr = data as unknown[];
          const maybeObj = dataArr[0];
          if (
            data &&
            Array.isArray(data) &&
            dataArr.length > 0 &&
            typeof maybeObj === 'object' &&
            maybeObj !== null &&
            !Array.isArray(maybeObj)
          ) {
            set((state) => ({ sideEffects: [...state.sideEffects, { ...(maybeObj as Record<string, any>), date: ensureString((maybeObj as Record<string, any>).date), type: ensureString((maybeObj as Record<string, any>).type) }] }));
            // Optionally update daily log
            const dailyLog = await get().getDailyLog(newEffect.date);
            if (dailyLog && typeof dailyLog === 'object' && dailyLog !== null && Array.isArray(dailyLog.sideEffects)) {
              await get().updateDailyLog(newEffect.date, {
                sideEffects: [...dailyLog.sideEffects, { ...(maybeObj as Record<string, any>), date: ensureString((maybeObj as Record<string, any>).date), type: ensureString((maybeObj as Record<string, any>).type) }]
              });
            }
          }
        } catch (e) { /* handle error */ }
      },
      updateSideEffect: async (id: string, data: Partial<SideEffect>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const updateData = { ...data, date: data.date ? ensureString(data.date) : undefined, type: data.type ? ensureString(data.type) : undefined, severity: data.severity ?? 'mild', user_id: user.id };
          const { error } = await supabase
            .from('side_effects')
            .update([updateData]).eq('id', id);
          if (error) throw error;
          set((state) => ({ sideEffects: state.sideEffects.map(effect => effect.id === id ? { ...effect, ...updateData, date: ensureString(updateData.date), type: ensureString(updateData.type) } : effect) }));
        } catch (e) { /* handle error */ }
      },
      deleteSideEffect: async (id: string) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { error } = await supabase
            .from('side_effects')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
          if (error) throw error;
          set((state) => ({
            sideEffects: state.sideEffects.filter((effect) => effect.id !== id)
          }));
          // Optionally update daily logs
          set((state) => ({
            dailyLogs: state.dailyLogs.map(log => ({
              ...log,
              sideEffects: log.sideEffects.filter(effect => effect.id !== id)
            }))
          }));
        } catch (e) { /* handle error */ }
      },
      
      // Meal methods
      addMeal: async (meal: Omit<Meal, 'id'>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const newMeal = { ...meal, date: ensureString(meal.date), user_id: user.id };
          const { data, error } = await supabase
            .from('meals')
            .insert([newMeal]);
          if (error) throw error;
          const dataArr = data as unknown[];
          const maybeObj = dataArr[0];
          if (
            data &&
            Array.isArray(data) &&
            dataArr.length > 0 &&
            typeof maybeObj === 'object' &&
            maybeObj !== null &&
            !Array.isArray(maybeObj)
          ) {
            set((state) => ({ meals: [...state.meals, { ...(maybeObj as Record<string, any>), date: ensureString((maybeObj as Record<string, any>).date) }] }));
          }
        } catch (e) { /* handle error */ }
      },
      updateMeal: async (id: string, data: Partial<Meal>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const updateData = { ...data, date: data.date ? ensureString(data.date) : undefined, user_id: user.id };
          const { error } = await supabase
            .from('meals')
            .update([updateData]).eq('id', id);
          if (error) throw error;
          set((state) => ({
            meals: state.meals.map((meal) => meal.id === id ? { ...meal, ...updateData, date: ensureString(updateData.date) } : meal),
            savedMeals: state.savedMeals.map((meal) => meal.id === id ? { ...meal, ...updateData, date: ensureString(updateData.date) } : meal)
          }));
        } catch (e) { /* handle error */ }
      },
      deleteMeal: async (id: string) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { error } = await supabase
            .from('meals')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
          if (error) throw error;
          set((state) => ({ meals: state.meals.filter((meal) => meal.id !== id) }));
        } catch (e) { /* handle error */ }
      },
      saveMeal: async (id: string) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { data, error } = await supabase
            .from('saved_meals')
            .insert([{ meal_id: id, user_id: user.id }]);
          if (error) throw error;
          const dataArr = data as unknown[];
          const maybeObj = dataArr[0];
          if (
            data &&
            Array.isArray(data) &&
            dataArr.length > 0 &&
            typeof maybeObj === 'object' &&
            maybeObj !== null &&
            !Array.isArray(maybeObj)
          ) {
            set((state) => {
              const meal = state.meals.find(m => m.id === id);
              if (!meal) return {};
              return {
                savedMeals: [...state.savedMeals, { ...(meal as Record<string, any>), isSaved: true, date: ensureString((meal as Record<string, any>).date) }],
                meals: state.meals.map(meal => meal.id === id ? { ...(meal as Record<string, any>), isSaved: true, date: ensureString((meal as Record<string, any>).date) } : meal)
              };
            });
          }
        } catch (e) { /* handle error */ }
      },
      unsaveMeal: async (id: string) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          // Find saved meal id
          const savedMeal = get().savedMeals.find(m => m.id === id);
          if (!savedMeal) return;
          const { error } = await supabase
            .from('saved_meals')
            .delete()
            .eq('meal_id', id)
            .eq('user_id', user.id);
          if (error) throw error;
          set((state) => ({
            savedMeals: state.savedMeals.filter(meal => meal.id !== id),
            meals: state.meals.map(meal => meal.id === id ? { ...meal, isSaved: false, date: ensureString(meal.date) } : meal)
          }));
        } catch (e) { /* handle error */ }
      },
      
      // Water methods
      addWaterLog: async (log: Omit<WaterLog, 'id'>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const newLog = { ...log, date: ensureString(log.date), user_id: user.id };
          const { data, error } = await supabase
            .from('water_logs')
            .insert([newLog]);
          if (error) throw error;
          const dataArr = data as unknown[];
          const maybeObj = dataArr[0];
          if (
            data &&
            Array.isArray(data) &&
            dataArr.length > 0 &&
            typeof maybeObj === 'object' &&
            maybeObj !== null &&
            !Array.isArray(maybeObj)
          ) {
            set((state) => ({ waterLogs: [...state.waterLogs, { ...(maybeObj as Record<string, any>), date: ensureString((maybeObj as Record<string, any>).date) }] }));
          }
        } catch (e) { /* handle error */ }
      },
      updateWaterLog: async (id: string, data: Partial<WaterLog>) => {
        // Not implemented in backend, but could be added if needed
      },
      
      // Step methods
      addStepLog: async (log: Omit<StepLog, 'id'>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const newLog = { ...log, date: ensureString(log.date), user_id: user.id };
          const { data, error } = await supabase
            .from('step_logs')
            .insert([newLog]);
          if (error) throw error;
          const dataArr = data as unknown[];
          const maybeObj = dataArr[0];
          if (
            data &&
            Array.isArray(data) &&
            dataArr.length > 0 &&
            typeof maybeObj === 'object' &&
            maybeObj !== null &&
            !Array.isArray(maybeObj)
          ) {
            set((state) => ({ stepLogs: [...state.stepLogs, { ...(maybeObj as Record<string, any>), date: ensureString((maybeObj as Record<string, any>).date) }] }));
          }
        } catch (e) { /* handle error */ }
      },
      updateStepLog: async (id: string, data: Partial<StepLog>) => {
        // Not implemented in backend, but could be added if needed
      },
      
      // Daily log methods
      getDailyLog: async (date: string) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return undefined;
        try {
          const { data, error } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('date', date)
            .eq('user_id', user.id)
            .single();
          if (error) throw error;
          return data as DailyLog;
        } catch (e) { /* handle error */ }
        return undefined;
      },
      updateDailyLog: async (date: string, data: Partial<Omit<DailyLog, 'id' | 'date'>>) => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          // Upsert daily log for the user and date
          const { error } = await supabase
            .from('daily_logs')
            .upsert([{ ...data, date, user_id: user.id }], { onConflict: 'date,user_id' });
          if (error) throw error;
          // Optionally refetch daily log
          // (You can add logic here to update Zustand state if needed)
        } catch (e) { /* handle error */ }
      },
      
      // Fetch methods
      fetchWeightLogs: async () => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { data, error } = await supabase
            .from('weight_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          if (error) throw error;
          if (data) set({ weightLogs: data.map((log: any) => ({ ...log, date: ensureString(log.date), weight: log.weight ?? 0 })) });
        } catch (e) { /* handle error */ }
      },
      fetchShots: async () => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { data, error } = await supabase
            .from('shots')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          if (error) throw error;
          if (data) set({ shots: data.map((shot: any) => ({ ...shot, date: ensureString(shot.date), time: ensureString(shot.time) })) });
        } catch (e) { /* handle error */ }
      },
      fetchSideEffects: async () => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { data, error } = await supabase
            .from('side_effects')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          if (error) throw error;
          if (data) set({ sideEffects: data.map((effect: any) => ({ ...effect, date: ensureString(effect.date), type: ensureString(effect.type), severity: effect.severity ?? 'mild' })) });
        } catch (e) { /* handle error */ }
      },
      fetchWaterLogs: async () => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { data, error } = await supabase
            .from('water_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          if (error) throw error;
          if (data) set({ waterLogs: data.map((log: any) => ({ ...log, date: ensureString(log.date), amount: log.amount ?? 0 })) });
        } catch (e) { /* handle error */ }
      },
      fetchStepLogs: async () => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { data, error } = await supabase
            .from('step_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          if (error) throw error;
          if (data) set({ stepLogs: data.map((log: any) => ({ ...log, date: ensureString(log.date), steps: log.steps ?? 0 })) });
        } catch (e) { /* handle error */ }
      },
      fetchDailyLogs: async () => {
        const user = useUserStore.getState().user;
        if (!user?.id) return;
        try {
          const { data, error } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          if (error) throw error;
          if (data) set({ dailyLogs: data.map((log: any) => ({ ...log, date: ensureString(log.date) })) });
        } catch (e) { /* handle error */ }
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
      },
      
      setShots: (shots: Shot[]) => set({ shots: shots.map(shot => ({
        ...shot,
        date: ensureString(shot.date),
        time: ensureString(shot.time),
      })) }),
      setWeightLogs: (weightLogs: WeightLog[]) => set({ weightLogs: weightLogs.map(log => ({
        ...log,
        date: ensureString(log.date),
        weight: log.weight ?? 0,
      })) }),
      setSideEffects: (sideEffects: SideEffect[]) => set({ sideEffects: sideEffects.map(effect => ({
        ...effect,
        date: ensureString(effect.date),
        type: ensureString(effect.type),
        severity: effect.severity ?? 'mild',
      })) }),
    }),
    {
      name: 'health-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
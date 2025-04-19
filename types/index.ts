export interface User {
  id: string;
  name: string;
  email: string;
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
  height: number;
  startDate: string;
  targetDate: string;
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  notes?: string;
}

export interface Shot {
  id: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
  medication?: string;
}

export interface SideEffect {
  id: string;
  date: string;
  type: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface Meal {
  id: string;
  date: string;
  time: string;
  name: string;
  description?: string;
  imageUri?: string;
  fruitsVeggies?: number;
  protein?: number;
  calories?: number;
  carbs?: number;
  fat?: number;
  isSaved?: boolean;
}

export interface WaterLog {
  id: string;
  date: string;
  amount: number; // in fluid ounces
}

export interface StepLog {
  id: string;
  date: string;
  count: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  isCompleted: boolean;
  progress: number;
  category: 'weight' | 'nutrition' | 'activity' | 'medication' | 'other';
}

export interface JourneyStage {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  order: number;
}

export interface DailyLog {
  id: string;
  date: string;
  fruitsVeggies: number;
  proteinGrams: number;
  waterOz: number;
  steps: number;
  weight?: number;
  shotTaken?: boolean;
  meals: Meal[];
  sideEffects: SideEffect[];
}

export interface WeeklyScore {
  fruitsVeggies: number;
  protein: number;
  steps: number;
  overall: number;
}

// Gamification types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  category: 'weight' | 'nutrition' | 'activity' | 'medication' | 'streak' | 'journey';
  points: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  progress: number;
  category: 'weight' | 'nutrition' | 'activity' | 'medication';
  reward: number; // points
}

export interface Streak {
  weight: number;
  meals: number;
  steps: number;
  water: number;
  shots: number;
  login: number;
  lastLoginDate?: string;
}
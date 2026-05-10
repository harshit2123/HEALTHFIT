import { api } from './api'

export interface SubscriptionStatus {
  type: 'B2B' | 'B2C'
  // B2B fields
  planName?: string
  status: string
  expiresAt?: string
  daysRemaining: number | null
  priceInr?: string
  // B2C fields
  tier?: 'FREE' | 'TRIAL' | 'PREMIUM'
  trialEndsAt?: string
  premiumEndsAt?: string
}

export interface MyProfile {
  id: string
  email: string
  name: string
  phone: string | null
  role: string
  accountType: 'B2B' | 'B2C'
  orgId: string | null
  profile: {
    age: number | null
    gender: string | null
    heightCm: string | null
    currentWeightKg: string | null
    fitnessLevel: string | null
    primaryGoal: string | null
    streakDays: number
    timezone: string
    language: string
  } | null
  org: { id: string; name: string; logoUrl: string | null } | null
  memberSub: { plan: { name: string } } | null
  personalSub: { tier: string } | null
  assignedToTrainer: Array<{
    trainer: { id: string; name: string; email: string }
  }>
}

export const clientApi = {
  getProfile: async (): Promise<MyProfile> => {
    const res = await api.get('/client/profile')
    return res.data.data
  },

  updateProfile: async (data: Partial<{
    name: string
    phone: string
    age: number
    gender: string
    heightCm: number
    currentWeightKg: number
    fitnessLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    primaryGoal: 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'BUILD_ENDURANCE' | 'JUST_TRACK'
    timezone: string
    language: string
  }>) => {
    const res = await api.put('/client/profile', data)
    return res.data.data
  },

  getSubscription: async (): Promise<SubscriptionStatus | null> => {
    const res = await api.get('/client/subscription')
    return res.data.data
  },

  upgradeToPremium: async (durationMonths = 1) => {
    const res = await api.post('/client/subscription/upgrade', { durationMonths })
    return res.data.data
  },

  cancelPremium: async () => {
    const res = await api.post('/client/subscription/cancel')
    return res.data.data
  },
}

// =====================================================
// CALORIES
// =====================================================

export interface FoodItem {
  id: string
  name: string
  nameLocal: string | null
  category: string | null
  servingSize: string
  caloriesPer100g: string
  proteinG: string
  carbsG: string
  fatG: string
  fiberG: string | null
  isCustom: boolean
  isIndian: boolean
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER'

export interface CalorieLog {
  id: string
  loggedDate: string
  mealType: MealType
  foodName: string
  servingSize: string
  calories: string
  proteinG: string
  carbsG: string
  fatG: string
  fiberG: string | null
  createdAt: string
}

export interface DailyBreakdown {
  summary: {
    date: string
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
    byMeal: Record<string, { calories: number; entries: number }>
  }
  logs: CalorieLog[]
}

export interface DailyTotal {
  date: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export const calorieApi = {
  searchFoods: async (q: string, limit = 20): Promise<FoodItem[]> => {
    const res = await api.get('/client/foods/search', { params: { q, limit } })
    return res.data.data
  },

  listCategories: async (): Promise<string[]> => {
    const res = await api.get('/client/foods/categories')
    return res.data.data
  },

  createCustomFood: async (data: {
    name: string
    servingSize: string
    caloriesPer100g: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG?: number
  }): Promise<FoodItem> => {
    const res = await api.post('/client/foods', data)
    return res.data.data
  },

  logCalorie: async (data: {
    mealType: MealType
    foodName: string
    servingSize: string
    foodId?: string
    servingMultiplier?: number
    calories?: number
    proteinG?: number
    carbsG?: number
    fatG?: number
    fiberG?: number
    loggedDate?: string
  }): Promise<CalorieLog> => {
    const res = await api.post('/client/calories', data)
    return res.data.data
  },

  getDaily: async (date?: string): Promise<DailyBreakdown> => {
    const res = await api.get('/client/calories', { params: date ? { date } : undefined })
    return res.data.data
  },

  getRange: async (start: string, end: string): Promise<DailyTotal[]> => {
    const res = await api.get('/client/calories/range', { params: { start, end } })
    return res.data.data
  },

  deleteLog: async (id: string) => {
    await api.delete(`/client/calories/${id}`)
  },

  updateLog: async (
    id: string,
    data: { servingMultiplier?: number; mealType?: MealType }
  ): Promise<CalorieLog> => {
    const res = await api.patch(`/client/calories/${id}`, data)
    return res.data.data
  },

  getSuggestions: async (
    limit = 8
  ): Promise<{ recent: FoodItem[]; frequent: FoodItem[] }> => {
    const res = await api.get('/client/foods/suggestions', { params: { limit } })
    return res.data.data
  },

  getDailyTarget: async (): Promise<{ dailyCalorieTarget: number | null }> => {
    const res = await api.get('/client/calories/target')
    return res.data.data
  },

  getStreak: async (): Promise<{
    streakDays: number
    streakLastDate: string | null
    isActiveToday: boolean
  }> => {
    const res = await api.get('/client/streak')
    return res.data.data
  },

  // AI-powered lookup: DB first, AI fallback, cached.
  lookupFood: async (query: string): Promise<{ food: FoodItem; source: 'DB' | 'AI'; aiAvailable: boolean }> => {
    const res = await api.post('/client/foods/lookup', { query })
    return res.data.data
  },

  // Parse a sentence with multiple foods.
  parseMeal: async (text: string): Promise<{
    items: Array<{ food: FoodItem; source: 'DB' | 'AI'; aiServingSize?: string }>
    aiAvailable: boolean
  }> => {
    const res = await api.post('/client/foods/parse-meal', { text })
    return res.data.data
  },

  getAIStatus: async (): Promise<{
    aiAvailable: boolean
    activeProvider: 'anthropic' | 'gemini' | 'groq' | null
    providers: Array<{ name: 'anthropic' | 'gemini' | 'groq'; configured: boolean }>
  }> => {
    const res = await api.get('/client/foods/ai-status')
    return res.data.data
  },
}

// =====================================================
// WORKOUTS
// =====================================================

export type ExerciseCategory =
  | 'STRENGTH'
  | 'CARDIO'
  | 'FLEXIBILITY'
  | 'SPORTS'
  | 'BODYWEIGHT'
  | 'OTHER'

export type WorkoutType = 'CARDIO' | 'STRENGTH' | 'FLEXIBILITY' | 'SPORTS' | 'OTHER'
export type Intensity = 'LIGHT' | 'MODERATE' | 'HIGH'

export interface Exercise {
  id: string
  name: string
  nameLocal: string | null
  category: ExerciseCategory
  primaryMuscles: string[]
  secondaryMuscles?: string[] | null
  equipment: string | null
  defaultUnit: 'REPS' | 'TIME' | 'DISTANCE'
  metPerKg: string | null
  isCustom: boolean
  source: 'MANUAL' | 'USER_CUSTOM' | 'AI_GENERATED'
  isVerified: boolean
  usageCount: number
  frequency?: number
}

export interface WorkoutSet {
  id: string
  setIndex: number
  reps: number | null
  weightKg: string | null
  distanceKm: string | null
  timeSeconds: number | null
  rpe: number | null
  isWarmup: boolean
  isPR: boolean
  notes: string | null
}

export interface WorkoutEntry {
  id: string
  exerciseId: string | null
  exerciseName: string
  orderIndex: number
  notes: string | null
  sets: WorkoutSet[]
  exercise?: Exercise | null
}

export interface Workout {
  id: string
  loggedDate: string
  workoutType: WorkoutType
  durationMin: number
  intensity: Intensity
  caloriesBurned: number | null
  notes: string | null
  routineId: string | null
  exercises: WorkoutEntry[]
}

export interface Routine {
  id: string
  name: string
  description: string | null
  isSuggested: boolean
  usageCount: number
  lastUsedAt: string | null
  exercises: Array<{
    id: string
    exerciseId: string | null
    exerciseName: string
    orderIndex: number
    setScheme: string | null
    notes: string | null
  }>
}

export interface LogSetData {
  reps?: number
  weightKg?: number
  distanceKm?: number
  timeSeconds?: number
  rpe?: number
  isWarmup?: boolean
  notes?: string
}

export interface LogWorkoutData {
  loggedDate?: string
  workoutType: WorkoutType
  durationMin: number
  intensity: Intensity
  notes?: string
  routineId?: string
  entries: Array<{
    exerciseId?: string
    exerciseName: string
    notes?: string
    sets: LogSetData[]
  }>
}

export const workoutApi = {
  searchExercises: async (q: string, limit = 20): Promise<Exercise[]> => {
    const res = await api.get('/client/exercises/search', { params: { q, limit } })
    return res.data.data
  },
  getFrequentExercises: async (limit = 8): Promise<Exercise[]> => {
    const res = await api.get('/client/exercises/frequent', { params: { limit } })
    return res.data.data
  },
  lookupExercise: async (
    query: string
  ): Promise<{ exercise: Exercise; source: 'DB' | 'AI'; aiAvailable: boolean }> => {
    const res = await api.post('/client/exercises/lookup', { query })
    return res.data.data
  },
  getLastSet: async (exerciseId: string): Promise<WorkoutSet | null> => {
    const res = await api.get(`/client/exercises/${exerciseId}/last-set`)
    return res.data.data
  },
  log: async (data: LogWorkoutData): Promise<Workout> => {
    const res = await api.post('/client/workouts', data)
    return res.data.data
  },
  list: async (
    page = 1,
    limit = 20
  ): Promise<{
    workouts: Workout[]
    total: number
    page: number
    limit: number
  }> => {
    const res = await api.get('/client/workouts', { params: { page, limit } })
    return res.data.data
  },
  getDay: async (date: string): Promise<Workout[]> => {
    const res = await api.get('/client/workouts', { params: { date } })
    return res.data.data
  },
  weeklyStats: async (): Promise<{
    count: number
    totalMinutes: number
    totalCalories: number
    byType: Record<string, number>
  }> => {
    const res = await api.get('/client/workouts/weekly-stats')
    return res.data.data
  },
  get: async (id: string): Promise<Workout> => {
    const res = await api.get(`/client/workouts/${id}`)
    return res.data.data
  },
  delete: async (id: string) => {
    await api.delete(`/client/workouts/${id}`)
  },
  listRoutines: async (): Promise<Routine[]> => {
    const res = await api.get('/client/routines')
    return res.data.data
  },
  suggestRoutine: async (): Promise<{
    name: string
    exercises: Array<{ exerciseId: string; exerciseName: string; setScheme: string }>
  } | null> => {
    const res = await api.get('/client/routines/suggest')
    return res.data.data
  },
  createRoutine: async (data: {
    name: string
    description?: string
    exercises: Array<{
      exerciseId?: string
      exerciseName: string
      setScheme?: string
      notes?: string
    }>
  }): Promise<Routine> => {
    const res = await api.post('/client/routines', data)
    return res.data.data
  },
  deleteRoutine: async (id: string) => {
    await api.delete(`/client/routines/${id}`)
  },
}

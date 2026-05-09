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

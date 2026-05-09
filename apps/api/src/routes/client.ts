import { Router } from 'express'
import { z } from 'zod'
import { getMyProfile, updateMyProfile, getMySubscription } from '../services/clientService.js'
import { upgradeToPremium, cancelPremium } from '../services/subscriptionService.js'
import { requireRole } from '../middleware/requireRole.js'
import {
  searchFoods,
  listCategories,
  createCustomFood,
  logCalorie,
  deleteCalorieLog,
  updateCalorieLog,
  getDailyBreakdown,
  getDailyTotals,
  getSuggestedDailyTarget,
  lookupOrEstimateFood,
  parseMealText,
  getPersonalFoodSuggestions,
} from '../services/calorieService.js'
import { isAIConfigured, getActiveProvider, getProviderStatus } from '../services/ai/calorieEstimator.js'

export const clientRouter = Router()

// ==================== PROFILE ====================

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: z.string().optional(),
  heightCm: z.number().min(50).max(300).optional(),
  currentWeightKg: z.number().min(20).max(500).optional(),
  fitnessLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
})

clientRouter.get('/profile', async (req, res, next) => {
  try {
    const profile = await getMyProfile(req.user!.userId)
    res.json({ success: true, data: profile, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.put('/profile', async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const updated = await updateMyProfile(req.user!.userId, parsed.data)
    res.json({ success: true, data: updated, error: null })
  } catch (err) {
    next(err)
  }
})

// ==================== SUBSCRIPTION ====================

clientRouter.get('/subscription', async (req, res, next) => {
  try {
    const sub = await getMySubscription(req.user!.userId)
    res.json({ success: true, data: sub, error: null })
  } catch (err) {
    next(err)
  }
})

// B2C: Upgrade trial/free to premium
const upgradeSchema = z.object({
  durationMonths: z.number().int().min(1).max(12).default(1),
})

clientRouter.post(
  '/subscription/upgrade',
  requireRole(['INDIVIDUAL_USER']),
  async (req, res, next) => {
    try {
      const parsed = upgradeSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
        return
      }
      const sub = await upgradeToPremium(req.user!.userId, parsed.data.durationMonths)
      res.json({ success: true, data: sub, error: null })
    } catch (err) {
      if (err instanceof Error) {
        res.status(404).json({ success: false, data: null, error: err.message })
        return
      }
      next(err)
    }
  }
)

clientRouter.post(
  '/subscription/cancel',
  requireRole(['INDIVIDUAL_USER']),
  async (req, res, next) => {
    try {
      const sub = await cancelPremium(req.user!.userId)
      res.json({ success: true, data: sub, error: null })
    } catch (err) {
      if (err instanceof Error) {
        res.status(404).json({ success: false, data: null, error: err.message })
        return
      }
      next(err)
    }
  }
)

// ==================== STUBS (built in later phases) ====================

clientRouter.post('/workouts', (_req, res) => {
  res.json({ success: true, data: { message: 'Log workout — Phase 6' }, error: null })
})

clientRouter.get('/workouts', (_req, res) => {
  res.json({ success: true, data: { message: 'Workout history — Phase 6' }, error: null })
})

// =====================================================
// CALORIES
// =====================================================

const logCalorieSchema = z
  .object({
    loggedDate: z.string().datetime().optional(),
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']),
    foodName: z.string().min(1),
    servingSize: z.string().min(1),
    foodId: z.string().uuid().optional(),
    servingMultiplier: z.number().positive().optional(),
    calories: z.number().nonnegative().optional(),
    proteinG: z.number().nonnegative().optional(),
    carbsG: z.number().nonnegative().optional(),
    fatG: z.number().nonnegative().optional(),
    fiberG: z.number().nonnegative().optional(),
  })
  .refine((d) => d.foodId || d.calories !== undefined, {
    message: 'Either foodId or calories required',
  })

clientRouter.post('/calories', async (req, res, next) => {
  try {
    const parsed = logCalorieSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const log = await logCalorie(req.user!.userId, req.user!.orgId, {
      loggedDate: parsed.data.loggedDate ? new Date(parsed.data.loggedDate) : new Date(),
      mealType: parsed.data.mealType,
      foodName: parsed.data.foodName,
      servingSize: parsed.data.servingSize,
      foodId: parsed.data.foodId,
      servingMultiplier: parsed.data.servingMultiplier,
      calories: parsed.data.calories,
      proteinG: parsed.data.proteinG,
      carbsG: parsed.data.carbsG,
      fatG: parsed.data.fatG,
      fiberG: parsed.data.fiberG,
    })
    res.status(201).json({ success: true, data: log, error: null })
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

clientRouter.get('/calories', async (req, res, next) => {
  try {
    const dateStr = typeof req.query['date'] === 'string' ? req.query['date'] : undefined
    const date = dateStr ? new Date(dateStr) : new Date()
    const result = await getDailyBreakdown(req.user!.userId, date)
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/calories/range', async (req, res, next) => {
  try {
    const startStr = typeof req.query['start'] === 'string' ? req.query['start'] : undefined
    const endStr = typeof req.query['end'] === 'string' ? req.query['end'] : undefined
    if (!startStr || !endStr) {
      res.status(400).json({ success: false, data: null, error: 'start and end query params required' })
      return
    }
    const totals = await getDailyTotals(req.user!.userId, new Date(startStr), new Date(endStr))
    res.json({ success: true, data: totals, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.delete('/calories/:id', async (req, res, next) => {
  try {
    await deleteCalorieLog(req.params['id']!, req.user!.userId)
    res.json({ success: true, data: null, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Log not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

const updateLogSchema = z
  .object({
    servingMultiplier: z.number().positive().optional(),
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']).optional(),
  })
  .refine((d) => d.servingMultiplier !== undefined || d.mealType !== undefined, {
    message: 'At least one field required',
  })

clientRouter.patch('/calories/:id', async (req, res, next) => {
  try {
    const parsed = updateLogSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const updated = await updateCalorieLog(req.params['id']!, req.user!.userId, parsed.data)
    res.json({ success: true, data: updated, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Log not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

clientRouter.get('/calories/target', async (req, res, next) => {
  try {
    const target = await getSuggestedDailyTarget(req.user!.userId)
    res.json({ success: true, data: { dailyCalorieTarget: target }, error: null })
  } catch (err) {
    next(err)
  }
})

// =====================================================
// FOODS
// =====================================================

clientRouter.get('/foods/search', async (req, res, next) => {
  try {
    const q = typeof req.query['q'] === 'string' ? req.query['q'] : ''
    const limit = req.query['limit'] ? Number(req.query['limit']) : 20
    const foods = await searchFoods(q, req.user!.userId, limit)
    res.json({ success: true, data: foods, error: null })
  } catch (err) {
    next(err)
  }
})

// Recently-used + frequently-used foods (personalized).
// UI shows these at the top of the meal-add dialog.
clientRouter.get('/foods/suggestions', async (req, res, next) => {
  try {
    const limit = req.query['limit'] ? Number(req.query['limit']) : 8
    const result = await getPersonalFoodSuggestions(req.user!.userId, limit)
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/foods/categories', async (_req, res, next) => {
  try {
    const cats = await listCategories()
    res.json({ success: true, data: cats, error: null })
  } catch (err) {
    next(err)
  }
})

const customFoodSchema = z.object({
  name: z.string().min(2),
  servingSize: z.string().min(1),
  caloriesPer100g: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  fiberG: z.number().nonnegative().optional(),
})

// AI lookup: DB-first, AI fallback, cached. Returns a single food.
const lookupSchema = z.object({ query: z.string().min(1).max(200) })

clientRouter.post('/foods/lookup', async (req, res, next) => {
  try {
    const parsed = lookupSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const result = await lookupOrEstimateFood(parsed.data.query, req.user!.userId)
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// AI bulk parse: "2 rotis, dal, rice" → multiple foods
const parseMealSchema = z.object({ text: z.string().min(2).max(500) })

clientRouter.post('/foods/parse-meal', async (req, res, next) => {
  try {
    const parsed = parseMealSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const result = await parseMealText(parsed.data.text, req.user!.userId)
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

clientRouter.get('/foods/ai-status', (_req, res) => {
  res.json({
    success: true,
    data: {
      aiAvailable: isAIConfigured(),
      activeProvider: getActiveProvider(),
      providers: getProviderStatus(),
    },
    error: null,
  })
})

clientRouter.post('/foods', async (req, res, next) => {
  try {
    const parsed = customFoodSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const food = await createCustomFood(req.user!.userId, parsed.data)
    res.status(201).json({ success: true, data: food, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.post('/goals', (_req, res) => {
  res.json({ success: true, data: { message: 'Create goal — Phase 7' }, error: null })
})

clientRouter.get('/goals', (_req, res) => {
  res.json({ success: true, data: { message: 'Goals list — Phase 7' }, error: null })
})

clientRouter.get('/analytics', (_req, res) => {
  res.json({ success: true, data: { message: 'Health analytics — Phase 7' }, error: null })
})

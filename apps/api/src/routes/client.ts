import { Router } from 'express'
import { z } from 'zod'
import { getMyProfile, updateMyProfile, getMySubscription } from '../services/clientService.js'
import { upgradeToPremium, cancelPremium } from '../services/subscriptionService.js'
import { requireRole } from '../middleware/requireRole.js'
import { parseDate, parsePositiveInt } from '../lib/validation.js'
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
import { getStreak } from '../services/streakService.js'
import {
  createGoal,
  listGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  getGoalProgress,
  getGoalAdjustedTarget,
} from '../services/goalService.js'
import {
  logHealthMetric,
  deleteHealthMetric,
  getWeightHistory,
  getLatestMetric,
} from '../services/healthMetricService.js'
import {
  getDailyActivityRange,
  getInsights,
  getWorkoutHeatmap,
} from '../services/analyticsService.js'
import {
  searchExercises,
  getExercise,
  createCustomExercise,
  lookupOrEstimateExercise,
  getFrequentExercises,
  getLastSetForExercise,
  logWorkout,
  getWorkoutById,
  deleteWorkout,
  getWorkoutsForDay,
  listWorkouts,
  getWeeklyStats,
  listRoutines,
  createRoutine,
  deleteRoutine,
  suggestRoutineFromHistory,
} from '../services/workoutService.js'
import { isAIConfigured, getActiveProvider, getProviderStatus } from '../services/ai/calorieEstimator.js'
import { getDietSuggestions } from '../services/dietSuggestionService.js'

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
  primaryGoal: z.enum(['LOSE_WEIGHT', 'GAIN_MUSCLE', 'BUILD_ENDURANCE', 'JUST_TRACK']).optional(),
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

// =====================================================
// WORKOUTS
// =====================================================

const setSchema = z.object({
  reps: z.number().int().nonnegative().optional(),
  weightKg: z.number().nonnegative().optional(),
  distanceKm: z.number().nonnegative().optional(),
  timeSeconds: z.number().int().nonnegative().optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  isWarmup: z.boolean().optional(),
  notes: z.string().optional(),
})

const entrySchema = z.object({
  exerciseId: z.string().uuid().optional(),
  exerciseName: z.string().min(1),
  notes: z.string().optional(),
  sets: z.array(setSchema).min(1),
})

const logWorkoutSchema = z.object({
  loggedDate: z.string().datetime().optional(),
  workoutType: z.enum(['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'OTHER']),
  durationMin: z.number().int().positive(),
  intensity: z.enum(['LIGHT', 'MODERATE', 'HIGH']),
  notes: z.string().optional(),
  routineId: z.string().uuid().optional(),
  entries: z.array(entrySchema).min(1),
})

clientRouter.post('/workouts', async (req, res, next) => {
  try {
    const parsed = logWorkoutSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const workout = await logWorkout(req.user!.userId, req.user!.orgId, {
      ...parsed.data,
      loggedDate: parsed.data.loggedDate ? new Date(parsed.data.loggedDate) : undefined,
      entries: parsed.data.entries.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
        notes: e.notes,
        sets: e.sets.map((s) => ({
          exerciseName: e.exerciseName,
          reps: s.reps,
          weightKg: s.weightKg,
          distanceKm: s.distanceKm,
          timeSeconds: s.timeSeconds,
          rpe: s.rpe,
          isWarmup: s.isWarmup,
          notes: s.notes,
        })),
      })),
    })
    res.status(201).json({ success: true, data: workout, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/workouts', async (req, res, next) => {
  try {
    const dateStr = typeof req.query['date'] === 'string' ? req.query['date'] : undefined
    if (dateStr) {
      const parsed = parseDate(dateStr)
      if (!parsed) { res.status(400).json({ success: false, data: null, error: 'Invalid date format' }); return }
      const list = await getWorkoutsForDay(req.user!.userId, parsed)
      res.json({ success: true, data: list, error: null })
      return
    }
    const result = await listWorkouts(req.user!.userId, {
      page: req.query['page'] ? Number(req.query['page']) : undefined,
      limit: req.query['limit'] ? Number(req.query['limit']) : undefined,
    })
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/workouts/weekly-stats', async (req, res, next) => {
  try {
    const stats = await getWeeklyStats(req.user!.userId)
    res.json({ success: true, data: stats, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/workouts/:id', async (req, res, next) => {
  try {
    const workout = await getWorkoutById(req.params['id']!, req.user!.userId)
    res.json({ success: true, data: workout, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Workout not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

clientRouter.delete('/workouts/:id', async (req, res, next) => {
  try {
    await deleteWorkout(req.params['id']!, req.user!.userId)
    res.json({ success: true, data: null, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Workout not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// =====================================================
// EXERCISES
// =====================================================

clientRouter.get('/exercises/search', async (req, res, next) => {
  try {
    const q = typeof req.query['q'] === 'string' ? req.query['q'] : ''
    const limit = req.query['limit'] ? Number(req.query['limit']) : 20
    const items = await searchExercises(q, req.user!.userId, limit)
    res.json({ success: true, data: items, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/exercises/frequent', async (req, res, next) => {
  try {
    const limit = req.query['limit'] ? Number(req.query['limit']) : 8
    const items = await getFrequentExercises(req.user!.userId, limit)
    res.json({ success: true, data: items, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/exercises/:id/last-set', async (req, res, next) => {
  try {
    const set = await getLastSetForExercise(req.user!.userId, req.params['id']!)
    res.json({ success: true, data: set, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/exercises/:id', async (req, res, next) => {
  try {
    const ex = await getExercise(req.params['id']!, req.user!.userId)
    res.json({ success: true, data: ex, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Exercise not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

const lookupExerciseSchema = z.object({ query: z.string().min(1).max(100) })

clientRouter.post('/exercises/lookup', async (req, res, next) => {
  try {
    const parsed = lookupExerciseSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const result = await lookupOrEstimateExercise(parsed.data.query, req.user!.userId)
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

const customExerciseSchema = z.object({
  name: z.string().min(2),
  category: z.enum(['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'SPORTS', 'BODYWEIGHT', 'OTHER']),
  primaryMuscles: z.array(z.string()).min(1),
  equipment: z.string().optional(),
  defaultUnit: z.enum(['REPS', 'TIME', 'DISTANCE']).optional(),
})

clientRouter.post('/exercises', async (req, res, next) => {
  try {
    const parsed = customExerciseSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const ex = await createCustomExercise(req.user!.userId, parsed.data)
    res.status(201).json({ success: true, data: ex, error: null })
  } catch (err) {
    next(err)
  }
})

// =====================================================
// ROUTINES (templates)
// =====================================================

clientRouter.get('/routines', async (req, res, next) => {
  try {
    const items = await listRoutines(req.user!.userId)
    res.json({ success: true, data: items, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/routines/suggest', async (req, res, next) => {
  try {
    const suggestion = await suggestRoutineFromHistory(req.user!.userId)
    res.json({ success: true, data: suggestion, error: null })
  } catch (err) {
    next(err)
  }
})

const routineExerciseSchema = z.object({
  exerciseId: z.string().uuid().optional(),
  exerciseName: z.string().min(1),
  setScheme: z.string().optional(),
  notes: z.string().optional(),
})

const routineSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  exercises: z.array(routineExerciseSchema).min(1),
})

clientRouter.post('/routines', async (req, res, next) => {
  try {
    const parsed = routineSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const r = await createRoutine(req.user!.userId, parsed.data)
    res.status(201).json({ success: true, data: r, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.delete('/routines/:id', async (req, res, next) => {
  try {
    await deleteRoutine(req.params['id']!, req.user!.userId)
    res.json({ success: true, data: null, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Routine not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
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
    const date = dateStr ? parseDate(dateStr) : new Date()
    if (dateStr && !date) { res.status(400).json({ success: false, data: null, error: 'Invalid date format' }); return }
    const result = await getDailyBreakdown(req.user!.userId, date!)
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
    const start = parseDate(startStr)
    const end = parseDate(endStr)
    if (!start || !end) { res.status(400).json({ success: false, data: null, error: 'Invalid date format' }); return }
    const totals = await getDailyTotals(req.user!.userId, start, end)
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

clientRouter.get('/streak', async (req, res, next) => {
  try {
    const streak = await getStreak(req.user!.userId)
    res.json({ success: true, data: streak, error: null })
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

// =====================================================
// GOALS
// =====================================================

const createGoalSchema = z.object({
  goalType: z.enum(['LOSE_WEIGHT', 'GAIN_MUSCLE', 'BUILD_ENDURANCE', 'IMPROVE_FLEXIBILITY', 'CUSTOM']),
  targetValue: z.number(),
  targetUnit: z.string().min(1),
  startingValue: z.number(),
  targetDate: z.string().datetime(),
  reason: z.string().optional(),
})

clientRouter.post('/goals', async (req, res, next) => {
  try {
    const parsed = createGoalSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const goal = await createGoal(req.user!.userId, req.user!.orgId, {
      ...parsed.data,
      targetDate: new Date(parsed.data.targetDate),
    })
    res.status(201).json({ success: true, data: goal, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/goals', async (req, res, next) => {
  try {
    const status = req.query['status']
    const goals = await listGoals(
      req.user!.userId,
      status === 'ACTIVE' || status === 'PAUSED' || status === 'COMPLETED' || status === 'ABANDONED'
        ? status
        : undefined
    )
    res.json({ success: true, data: goals, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/goals/active-target', async (req, res, next) => {
  try {
    const result = await getGoalAdjustedTarget(req.user!.userId)
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/goals/:id', async (req, res, next) => {
  try {
    const goal = await getGoal(req.params['id']!, req.user!.userId)
    res.json({ success: true, data: goal, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Goal not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

clientRouter.get('/goals/:id/progress', async (req, res, next) => {
  try {
    const progress = await getGoalProgress(req.params['id']!, req.user!.userId)
    res.json({ success: true, data: progress, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Goal not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

const updateGoalSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED']).optional(),
  targetValue: z.number().optional(),
  targetDate: z.string().datetime().optional(),
  reason: z.string().optional(),
})

clientRouter.patch('/goals/:id', async (req, res, next) => {
  try {
    const parsed = updateGoalSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const goal = await updateGoal(req.params['id']!, req.user!.userId, {
      ...parsed.data,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : undefined,
    })
    res.json({ success: true, data: goal, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Goal not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

clientRouter.delete('/goals/:id', async (req, res, next) => {
  try {
    await deleteGoal(req.params['id']!, req.user!.userId)
    res.json({ success: true, data: null, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Goal not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// =====================================================
// HEALTH METRICS (weight + measurements)
// =====================================================

const logMetricSchema = z.object({
  metricDate: z.string().datetime().optional(),
  weightKg: z.number().min(20).max(500).optional(),
  chestCm: z.number().min(30).max(200).optional(),
  waistCm: z.number().min(30).max(200).optional(),
  hipsCm: z.number().min(30).max(200).optional(),
  notes: z.string().optional(),
})

clientRouter.post('/health-metrics', async (req, res, next) => {
  try {
    const parsed = logMetricSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const m = await logHealthMetric(req.user!.userId, req.user!.orgId, {
      ...parsed.data,
      metricDate: parsed.data.metricDate ? new Date(parsed.data.metricDate) : undefined,
    })
    res.status(201).json({ success: true, data: m, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.delete('/health-metrics/:id', async (req, res, next) => {
  try {
    await deleteHealthMetric(req.params['id']!, req.user!.userId)
    res.json({ success: true, data: null, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Metric not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

clientRouter.get('/health-metrics/weight-history', async (req, res, next) => {
  try {
    const days = parsePositiveInt(req.query['days'] as string | undefined, 90, 365)
    const history = await getWeightHistory(req.user!.userId, days)
    res.json({ success: true, data: history, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/health-metrics/latest', async (req, res, next) => {
  try {
    const latest = await getLatestMetric(req.user!.userId)
    res.json({ success: true, data: latest, error: null })
  } catch (err) {
    next(err)
  }
})

// =====================================================
// ANALYTICS
// =====================================================

clientRouter.get('/analytics', async (req, res, next) => {
  try {
    const days = parsePositiveInt(req.query['days'] as string | undefined, 30, 365)
    const [activity, insights, heatmap] = await Promise.all([
      getDailyActivityRange(req.user!.userId, days),
      getInsights(req.user!.userId),
      getWorkoutHeatmap(req.user!.userId, 12),
    ])
    res.json({ success: true, data: { activity, insights, heatmap }, error: null })
  } catch (err) {
    next(err)
  }
})

clientRouter.get('/diet-suggestions', async (req, res, next) => {
  try {
    const suggestions = await getDietSuggestions(req.user!.userId)
    res.json({ success: true, data: suggestions, error: null })
  } catch (err) {
    next(err)
  }
})

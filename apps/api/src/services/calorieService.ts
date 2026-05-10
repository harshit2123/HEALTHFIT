import { prisma } from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'
import {
  estimateFood,
  estimateMealText,
  normalizeSearchKey,
  isAIConfigured,
  type EstimatedFood,
} from './ai/calorieEstimator.js'
import { bumpStreak } from './streakService.js'

// =====================================================
// FOOD SEARCH
// =====================================================

export async function searchFoods(query: string, userId?: string, limit = 20) {
  const safeLimit = Math.min(limit, 100)
  const visibilityFilter = {
    OR: [
      { isCustom: false },
      ...(userId ? [{ isCustom: true, createdByUserId: userId }] : []),
    ],
  }
  const nameFilter = query.trim()
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { nameLocal: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : undefined

  return prisma.foodItem.findMany({
    where: nameFilter ? { AND: [visibilityFilter, nameFilter] } : visibilityFilter,
    take: safeLimit,
    orderBy: [{ isCustom: 'asc' }, { name: 'asc' }],
  })
}

export async function getFood(foodId: string, userId: string) {
  const food = await prisma.foodItem.findFirst({
    where: {
      id: foodId,
      OR: [{ isCustom: false }, { createdByUserId: userId }],
    },
  })
  if (!food) throw new Error('Food not found')
  return food
}

export async function listCategories() {
  const result = await prisma.foodItem.findMany({
    where: { isCustom: false },
    select: { category: true },
    distinct: ['category'],
  })
  return result.map((r) => r.category).filter((c): c is string => !!c)
}

/**
 * Hybrid lookup: DB first, AI fallback, cache result.
 *
 * Returns a FoodItem (existing or newly cached AI estimate).
 * Increments usageCount so popular foods bubble up in search.
 */
export async function lookupOrEstimateFood(
  query: string,
  userId: string
): Promise<{ food: import('@prisma/client').FoodItem; source: 'DB' | 'AI'; aiAvailable: boolean }> {
  const trimmed = query.trim()
  if (!trimmed) throw new Error('Query is empty')

  const searchKey = normalizeSearchKey(trimmed)

  // 1. Cache hit by exact searchKey
  const cached = await prisma.foodItem.findFirst({
    where: { searchKey },
  })
  if (cached) {
    await prisma.foodItem.update({
      where: { id: cached.id },
      data: { usageCount: { increment: 1 } },
    })
    return { food: cached, source: 'DB', aiAvailable: isAIConfigured() }
  }

  // 2. Fuzzy hit by name (catches case differences in seed data without searchKey)
  const fuzzy = await prisma.foodItem.findFirst({
    where: {
      isCustom: false,
      name: { equals: trimmed, mode: 'insensitive' },
    },
  })
  if (fuzzy) {
    // Backfill the searchKey for next time
    await prisma.foodItem.update({
      where: { id: fuzzy.id },
      data: { searchKey, usageCount: { increment: 1 } },
    })
    return { food: fuzzy, source: 'DB', aiAvailable: isAIConfigured() }
  }

  // 3. AI fallback
  if (!isAIConfigured()) {
    throw new Error('Food not found and AI estimation is not configured')
  }

  const estimate = await estimateFood(trimmed)
  if (!estimate) {
    throw new Error('AI estimation failed')
  }

  // 4. Cache AI result for next user
  const newFood = await prisma.foodItem.create({
    data: {
      name: estimate.name,
      servingSize: estimate.servingSize,
      caloriesPer100g: estimate.cal, // stored as "per serving" since servingSize varies
      proteinG: estimate.p,
      carbsG: estimate.c,
      fatG: estimate.f,
      fiberG: estimate.fib,
      isCustom: false,
      isIndian: true,
      source: 'AI_GENERATED',
      isVerified: false,
      searchKey,
      usageCount: 1,
      createdByUserId: userId,
    },
  })

  return { food: newFood, source: 'AI', aiAvailable: true }
}

/**
 * Bulk parse: "2 rotis, dal, half cup rice" → multiple foods
 * Each food then goes through the same DB-first / AI-fallback / cache flow.
 */
export async function parseMealText(
  text: string,
  userId: string
): Promise<{
  items: Array<{
    food: import('@prisma/client').FoodItem
    source: 'DB' | 'AI'
    aiServingSize?: string
  }>
  aiAvailable: boolean
}> {
  if (!isAIConfigured()) {
    throw new Error('AI estimation is not configured')
  }

  const estimates = await estimateMealText(text)
  if (!estimates || estimates.length === 0) {
    throw new Error('Could not parse meal description')
  }

  const items = await Promise.all(
    estimates.map(async (est: EstimatedFood) => {
      const searchKey = normalizeSearchKey(est.name)

      // Try DB cache first (avoid duplicate AI calls)
      const existing = await prisma.foodItem.findFirst({ where: { searchKey } })
      if (existing) {
        await prisma.foodItem.update({
          where: { id: existing.id },
          data: { usageCount: { increment: 1 } },
        })
        return { food: existing, source: 'DB' as const, aiServingSize: est.servingSize }
      }

      // Cache the AI estimate
      const food = await prisma.foodItem.create({
        data: {
          name: est.name,
          servingSize: est.servingSize,
          caloriesPer100g: est.cal,
          proteinG: est.p,
          carbsG: est.c,
          fatG: est.f,
          fiberG: est.fib,
          isCustom: false,
          isIndian: true,
          source: 'AI_GENERATED',
          isVerified: false,
          searchKey,
          usageCount: 1,
          createdByUserId: userId,
        },
      })
      return { food, source: 'AI' as const, aiServingSize: est.servingSize }
    })
  )

  return { items, aiAvailable: true }
}

export async function createCustomFood(
  userId: string,
  input: {
    name: string
    servingSize: string
    caloriesPer100g: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG?: number
  }
) {
  return prisma.foodItem.create({
    data: {
      name: input.name,
      servingSize: input.servingSize,
      caloriesPer100g: input.caloriesPer100g,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      fiberG: input.fiberG,
      isCustom: true,
      createdByUserId: userId,
      isIndian: false,
    },
  })
}

// =====================================================
// CALORIE LOGGING
// =====================================================

export interface LogCalorieInput {
  loggedDate: Date
  mealType: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER'
  foodName: string
  servingSize: string
  // User can either pick a food (we copy macros) or enter manually
  foodId?: string // optional reference to FoodItem
  servingMultiplier?: number // e.g. "ate 2 servings" → 2
  // Manual override (used if foodId not provided)
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  fiberG?: number
}

/**
 * Log a meal entry. Two flows:
 * 1. User picks from food DB → we calculate macros from foodId × servingMultiplier
 * 2. User enters macros manually (e.g. restaurant meal)
 */
export async function logCalorie(userId: string, orgId: string | null, input: LogCalorieInput) {
  let calories = input.calories
  let proteinG = input.proteinG
  let carbsG = input.carbsG
  let fatG = input.fatG
  let fiberG = input.fiberG

  // If foodId provided, derive macros from food DB
  if (input.foodId) {
    const food = await getFood(input.foodId, userId)
    const mult = input.servingMultiplier ?? 1
    // Foods are stored per-100g; servingMultiplier is "how many of this food's serving size"
    // We approximate: multiplier = #servings, food.caloriesPer100g is per 100g
    // Simplified: assume each serving = 100g equivalent unless we want precise serving math
    // For MVP, use multiplier directly on per-100g values for predictable behavior.
    calories = Number(food.caloriesPer100g) * mult
    proteinG = Number(food.proteinG) * mult
    carbsG = Number(food.carbsG) * mult
    fatG = Number(food.fatG) * mult
    fiberG = food.fiberG ? Number(food.fiberG) * mult : undefined
  }

  if (calories === undefined || proteinG === undefined || carbsG === undefined || fatG === undefined) {
    throw new Error('Either foodId or full macro values (calories/protein/carbs/fat) required')
  }

  const log = await prisma.calorieLog.create({
    data: {
      userId,
      orgId,
      loggedDate: input.loggedDate,
      mealType: input.mealType,
      foodName: input.foodName,
      servingSize: input.servingSize,
      calories,
      proteinG,
      carbsG,
      fatG,
      fiberG,
    },
  })

  // Bump streak (best-effort — don't fail log if streak update errors)
  try {
    await bumpStreak(userId)
  } catch (err) {
    console.error('[streak] bump failed:', err)
  }

  return log
}

export async function deleteCalorieLog(logId: string, userId: string) {
  // Verify ownership
  const log = await prisma.calorieLog.findFirst({
    where: { id: logId, userId },
  })
  if (!log) throw new Error('Log not found')

  return prisma.calorieLog.delete({ where: { id: logId } })
}

interface UpdateCalorieLogInput {
  servingMultiplier?: number
  mealType?: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER'
}

/**
 * Edit a calorie log.
 * Users can change:
 * - Serving multiplier (recalculates macros if log is linked to a FoodItem)
 * - Meal type (move from breakfast → lunch etc)
 *
 * For manually-entered logs (no foodId), serving change just edits the display
 * label; macros stay as user entered them.
 */
export async function updateCalorieLog(
  logId: string,
  userId: string,
  input: UpdateCalorieLogInput
) {
  const log = await prisma.calorieLog.findFirst({
    where: { id: logId, userId },
  })
  if (!log) throw new Error('Log not found')

  const updates: Prisma.CalorieLogUpdateInput = {}

  if (input.mealType) {
    updates.mealType = input.mealType
  }

  // If the user wants to scale servings AND this log was originally linked to a food,
  // we recompute macros from the source food. Otherwise we just update the label.
  if (input.servingMultiplier !== undefined) {
    const mult = input.servingMultiplier
    if (mult <= 0) throw new Error('Serving multiplier must be positive')

    // Try to find the source food by name (we don't store foodId on the log)
    const source = await prisma.foodItem.findFirst({
      where: {
        name: log.foodName,
        OR: [{ isCustom: false }, { createdByUserId: userId }],
      },
    })

    if (source) {
      // Rescale from the food's per-serving values
      updates.calories = Number(source.caloriesPer100g) * mult
      updates.proteinG = Number(source.proteinG) * mult
      updates.carbsG = Number(source.carbsG) * mult
      updates.fatG = Number(source.fatG) * mult
      updates.fiberG = source.fiberG ? Number(source.fiberG) * mult : null
      updates.servingSize = `${mult} × ${source.servingSize}`
    } else {
      // Manual entry: just update the label, leave macros alone
      updates.servingSize = `${mult} × ${log.servingSize}`
    }
  }

  return prisma.calorieLog.update({
    where: { id: logId },
    data: updates,
  })
}

/**
 * Recently-used + frequently-used foods for the current user.
 * Sources:
 * - "recent": last N distinct foods this user logged (any meal)
 * - "frequent": top N foods by personal log count (last 60 days)
 *
 * UI shows these at the top of the meal-add dialog so common foods are 1-tap.
 */
export async function getPersonalFoodSuggestions(userId: string, limit = 8) {
  // Recent: distinct food names from last 30 days, ordered by most recent log
  const recentLogs = await prisma.calorieLog.findMany({
    where: {
      userId,
      loggedDate: { gte: daysAgo(30) },
    },
    select: { foodName: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 200, // pull plenty so we can dedupe in JS
  })

  const seenRecent = new Set<string>()
  const recentNames: string[] = []
  for (const log of recentLogs) {
    if (!seenRecent.has(log.foodName)) {
      seenRecent.add(log.foodName)
      recentNames.push(log.foodName)
      if (recentNames.length >= limit) break
    }
  }

  // Frequent: same window, but counted
  const frequentRaw = await prisma.calorieLog.groupBy({
    by: ['foodName'],
    where: {
      userId,
      loggedDate: { gte: daysAgo(60) },
    },
    _count: true,
    orderBy: { _count: { foodName: 'desc' } },
    take: limit,
  })
  const frequentNames = frequentRaw.map((r) => r.foodName)

  // Pull FoodItem records for the names
  const allNames = Array.from(new Set([...recentNames, ...frequentNames]))
  if (allNames.length === 0) return { recent: [], frequent: [] }

  const foods = await prisma.foodItem.findMany({
    where: {
      name: { in: allNames },
      OR: [{ isCustom: false }, { createdByUserId: userId }],
    },
  })
  const foodByName = new Map(foods.map((f) => [f.name, f]))

  return {
    recent: recentNames.map((n) => foodByName.get(n)).filter((f): f is NonNullable<typeof f> => !!f),
    frequent: frequentNames
      .map((n) => foodByName.get(n))
      .filter((f): f is NonNullable<typeof f> => !!f),
  }
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// =====================================================
// AGGREGATIONS
// =====================================================

interface DailySummary {
  date: string // YYYY-MM-DD
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  byMeal: Record<string, { calories: number; entries: number }>
}

/**
 * Get full breakdown for a single day.
 */
export async function getDailyBreakdown(userId: string, date: Date) {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setHours(23, 59, 59, 999)

  const logs = await prisma.calorieLog.findMany({
    where: {
      userId,
      loggedDate: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { createdAt: 'asc' },
  })

  const summary: DailySummary = {
    date: dayStart.toISOString().slice(0, 10),
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    byMeal: {},
  }

  for (const log of logs) {
    summary.calories += Number(log.calories)
    summary.proteinG += Number(log.proteinG)
    summary.carbsG += Number(log.carbsG)
    summary.fatG += Number(log.fatG)
    summary.fiberG += log.fiberG ? Number(log.fiberG) : 0

    const meal = log.mealType
    if (!summary.byMeal[meal]) summary.byMeal[meal] = { calories: 0, entries: 0 }
    summary.byMeal[meal].calories += Number(log.calories)
    summary.byMeal[meal].entries += 1
  }

  return { summary, logs }
}

/**
 * Daily totals across a date range (for weekly/monthly trend graphs).
 */
export async function getDailyTotals(userId: string, startDate: Date, endDate: Date) {
  const logs = await prisma.calorieLog.findMany({
    where: {
      userId,
      loggedDate: { gte: startDate, lte: endDate },
    },
    select: {
      loggedDate: true,
      calories: true,
      proteinG: true,
      carbsG: true,
      fatG: true,
    },
    orderBy: { loggedDate: 'asc' },
  })

  // Group by day in JS (Prisma group-by on date functions varies by DB)
  const byDay = new Map<
    string,
    { calories: number; proteinG: number; carbsG: number; fatG: number }
  >()

  for (const log of logs) {
    const day = log.loggedDate.toISOString().slice(0, 10)
    if (!byDay.has(day)) {
      byDay.set(day, { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 })
    }
    const entry = byDay.get(day)!
    entry.calories += Number(log.calories)
    entry.proteinG += Number(log.proteinG)
    entry.carbsG += Number(log.carbsG)
    entry.fatG += Number(log.fatG)
  }

  // Fill missing days with zeros
  const result: Array<{ date: string; calories: number; proteinG: number; carbsG: number; fatG: number }> = []
  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    const day = cursor.toISOString().slice(0, 10)
    const entry = byDay.get(day) ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    result.push({ date: day, ...entry })
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

/**
 * Daily calorie target. Now goal-aware — delegates to goalService for the math.
 * Active goal beats profile.primaryGoal for target calculation.
 */
export async function getSuggestedDailyTarget(userId: string): Promise<number | null> {
  // Lazy import to avoid cyclic dep
  const { getGoalAdjustedTarget } = await import('./goalService.js')
  const result = await getGoalAdjustedTarget(userId)
  return result.dailyCalorieTarget
}

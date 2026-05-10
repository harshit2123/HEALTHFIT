import { prisma } from '../lib/prisma.js'
import { getSuggestedDailyTarget } from './calorieService.js'

export interface NutrientGap {
  nutrient: string
  unit: string
  current: number
  target: number
  foods: string[]
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

// Evidence-based healthy macro ratios (40/30/30 carb/protein/fat)
// and Indian diet micronutrient targets
const MACRO_RATIOS = {
  proteinRatio: 0.30,  // 30% of kcal → g = kcal*0.30/4
  carbsRatio: 0.40,    // 40% of kcal → g = kcal*0.40/4
  fatRatio: 0.30,      // 30% of kcal → g = kcal*0.30/9
}

const FIBER_TARGET_G = 30  // ICMR recommendation
const SODIUM_MAX_MG = 2300  // WHO upper limit (if tracked)

// Indian-diet food suggestions for each nutrient gap
const FOOD_SUGGESTIONS: Record<string, string[]> = {
  protein: ['Dal', 'Paneer', 'Eggs', 'Chicken', 'Greek yogurt', 'Chickpeas', 'Tofu'],
  carbs: ['Brown rice', 'Roti', 'Oats', 'Sweet potato', 'Poha'],
  fat: ['Almonds', 'Walnuts', 'Ghee (small)', 'Peanuts', 'Avocado'],
  fiber: ['Rajma', 'Green vegetables', 'Fruits', 'Oats', 'Flaxseeds'],
  calories: ['Banana', 'Rice', 'Roti', 'Peanut butter', 'Dry fruits'],
}

export async function getDietSuggestions(userId: string): Promise<NutrientGap[]> {
  const today = new Date().toISOString().slice(0, 10)

  const [dailyLog, calorieTarget] = await Promise.all([
    getTodayTotals(userId, today),
    getSuggestedDailyTarget(userId),
  ])

  if (!calorieTarget) return []

  const proteinTargetG = Math.round((calorieTarget * MACRO_RATIOS.proteinRatio) / 4)
  const carbsTargetG = Math.round((calorieTarget * MACRO_RATIOS.carbsRatio) / 4)
  const fatTargetG = Math.round((calorieTarget * MACRO_RATIOS.fatRatio) / 9)

  const gaps: NutrientGap[] = []

  // Calories gap
  const calGap = calorieTarget - dailyLog.calories
  if (calGap > 200) {
    gaps.push({
      nutrient: 'Calories',
      unit: ' kcal',
      current: Math.round(dailyLog.calories),
      target: Math.round(calorieTarget),
      foods: FOOD_SUGGESTIONS['calories'] ?? [],
      priority: calGap > 600 ? 'HIGH' : 'MEDIUM',
    })
  } else if (dailyLog.calories > calorieTarget * 1.1) {
    gaps.push({
      nutrient: 'Calories',
      unit: ' kcal',
      current: Math.round(dailyLog.calories),
      target: Math.round(calorieTarget),
      foods: [],
      priority: 'HIGH',
    })
  }

  // Protein gap
  const protGap = proteinTargetG - dailyLog.proteinG
  if (protGap > 10) {
    gaps.push({
      nutrient: 'Protein',
      unit: 'g',
      current: Math.round(dailyLog.proteinG),
      target: proteinTargetG,
      foods: FOOD_SUGGESTIONS['protein'] ?? [],
      priority: protGap > 30 ? 'HIGH' : 'MEDIUM',
    })
  }

  // Carbs gap
  const carbGap = carbsTargetG - dailyLog.carbsG
  if (carbGap > 20) {
    gaps.push({
      nutrient: 'Carbs',
      unit: 'g',
      current: Math.round(dailyLog.carbsG),
      target: carbsTargetG,
      foods: FOOD_SUGGESTIONS['carbs'] ?? [],
      priority: 'LOW',
    })
  }

  // Fat gap
  const fatGap = fatTargetG - dailyLog.fatG
  if (fatGap > 8) {
    gaps.push({
      nutrient: 'Healthy fats',
      unit: 'g',
      current: Math.round(dailyLog.fatG),
      target: fatTargetG,
      foods: FOOD_SUGGESTIONS['fat'] ?? [],
      priority: 'LOW',
    })
  }

  // Fiber gap (estimate from carbs/food items if not tracked directly)
  const fiberEstimate = dailyLog.fiberG ?? estimateFiber(dailyLog.carbsG)
  const fiberGap = FIBER_TARGET_G - fiberEstimate
  if (fiberGap > 8) {
    gaps.push({
      nutrient: 'Fiber',
      unit: 'g',
      current: Math.round(fiberEstimate),
      target: FIBER_TARGET_G,
      foods: FOOD_SUGGESTIONS['fiber'] ?? [],
      priority: fiberGap > 15 ? 'HIGH' : 'MEDIUM',
    })
  }

  // Sort: HIGH → MEDIUM → LOW, cap at 4 suggestions
  return gaps
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, 4)
}

async function getTodayTotals(userId: string, date: string) {
  const logs = await prisma.calorieLog.findMany({
    where: {
      userId,
      loggedDate: new Date(date),
    },
    select: {
      calories: true,
      proteinG: true,
      carbsG: true,
      fatG: true,
      fiberG: true,
    },
  })

  type Totals = { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number }

  return logs.reduce<Totals>(
    (acc, log) => ({
      calories: acc.calories + Number(log.calories),
      proteinG: acc.proteinG + Number(log.proteinG),
      carbsG: acc.carbsG + Number(log.carbsG),
      fatG: acc.fatG + Number(log.fatG),
      fiberG: acc.fiberG + (log.fiberG ? Number(log.fiberG) : 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  )
}

function estimateFiber(carbsG: number): number {
  // Rough: ~10% of carbs as dietary fiber for mixed Indian diet
  return carbsG * 0.1
}

const PRIORITY_RANK: Record<NutrientGap['priority'], number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
}

export { SODIUM_MAX_MG }

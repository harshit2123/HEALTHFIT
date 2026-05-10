import { prisma } from '../lib/prisma.js'

/**
 * Self-improving analytics. Aggregates user activity over time.
 * Feeds Progress page charts.
 */

interface DayBucket {
  date: string // YYYY-MM-DD
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  workouts: number
  workoutMinutes: number
}

/**
 * 30-day daily activity rollup. Used for trend charts + heatmaps.
 */
export async function getDailyActivityRange(userId: string, days = 30): Promise<DayBucket[]> {
  const start = new Date()
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const [calorieLogs, workouts] = await Promise.all([
    prisma.calorieLog.findMany({
      where: { userId, loggedDate: { gte: start, lte: end } },
      select: { loggedDate: true, calories: true, proteinG: true, carbsG: true, fatG: true },
    }),
    prisma.workoutLog.findMany({
      where: { userId, loggedDate: { gte: start, lte: end } },
      select: { loggedDate: true, durationMin: true },
    }),
  ])

  const buckets = new Map<string, DayBucket>()
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, {
      date: key,
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      workouts: 0,
      workoutMinutes: 0,
    })
  }

  for (const log of calorieLogs) {
    const key = log.loggedDate.toISOString().slice(0, 10)
    const b = buckets.get(key)
    if (b) {
      b.calories += Number(log.calories)
      b.proteinG += Number(log.proteinG)
      b.carbsG += Number(log.carbsG)
      b.fatG += Number(log.fatG)
    }
  }

  for (const w of workouts) {
    const key = w.loggedDate.toISOString().slice(0, 10)
    const b = buckets.get(key)
    if (b) {
      b.workouts += 1
      b.workoutMinutes += w.durationMin
    }
  }

  return Array.from(buckets.values())
}

/**
 * Insights — auto-generated string summaries based on user data.
 * Self-improving: gets more useful as user logs more.
 */
export async function getInsights(userId: string): Promise<string[]> {
  const insights: string[] = []
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  // Workout consistency
  const recentWorkouts = await prisma.workoutLog.count({
    where: { userId, loggedDate: { gte: sevenDaysAgo } },
  })
  const priorWeekWorkouts = await prisma.workoutLog.count({
    where: { userId, loggedDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
  })

  if (recentWorkouts >= 5) {
    insights.push(`🔥 ${recentWorkouts} workouts this week. Strong consistency.`)
  } else if (recentWorkouts === 0 && priorWeekWorkouts > 0) {
    insights.push(`No workouts this week. Last week you did ${priorWeekWorkouts}. Get back on track.`)
  } else if (recentWorkouts > priorWeekWorkouts && priorWeekWorkouts > 0) {
    insights.push(`📈 ${recentWorkouts} workouts this week, up from ${priorWeekWorkouts} last week.`)
  }

  // Calorie trends
  const recentCals = await prisma.calorieLog.aggregate({
    where: { userId, loggedDate: { gte: sevenDaysAgo } },
    _sum: { calories: true },
    _count: true,
  })

  if (recentCals._count >= 7) {
    const avg = Number(recentCals._sum.calories ?? 0) / 7
    insights.push(`Daily average: ${Math.round(avg)} kcal across last 7 days.`)
  }

  // Weight trend
  const weights = await prisma.healthMetric.findMany({
    where: { userId, weightKg: { not: null }, metricDate: { gte: fourteenDaysAgo } },
    select: { weightKg: true, metricDate: true },
    orderBy: { metricDate: 'asc' },
  })

  if (weights.length >= 2) {
    const first = Number(weights[0]!.weightKg)
    const last = Number(weights[weights.length - 1]!.weightKg)
    const delta = last - first
    if (Math.abs(delta) >= 0.3) {
      insights.push(
        delta < 0
          ? `📉 Weight down ${Math.abs(delta).toFixed(1)} kg in last 2 weeks.`
          : `📈 Weight up ${delta.toFixed(1)} kg in last 2 weeks.`
      )
    }
  }

  // PR celebration
  const recentPRs = await prisma.workoutSet.count({
    where: {
      isPR: true,
      exerciseEntry: { workout: { userId, loggedDate: { gte: sevenDaysAgo } } },
    },
  })

  if (recentPRs > 0) {
    insights.push(`🏆 ${recentPRs} new personal record${recentPRs === 1 ? '' : 's'} this week.`)
  }

  return insights
}

/**
 * Workout heatmap — last 12 weeks, days with workouts marked.
 * Cult.fit / Strong calendar pattern.
 */
export async function getWorkoutHeatmap(
  userId: string,
  weeks = 12
): Promise<Array<{ date: string; count: number }>> {
  const start = new Date()
  start.setDate(start.getDate() - weeks * 7)
  start.setHours(0, 0, 0, 0)

  const workouts = await prisma.workoutLog.findMany({
    where: { userId, loggedDate: { gte: start } },
    select: { loggedDate: true },
  })

  const counts = new Map<string, number>()
  for (const w of workouts) {
    const key = w.loggedDate.toISOString().slice(0, 10)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const result: Array<{ date: string; count: number }> = []
  for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, count: counts.get(key) ?? 0 })
  }

  return result
}

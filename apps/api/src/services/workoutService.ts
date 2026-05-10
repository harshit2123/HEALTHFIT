import { prisma } from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'
import { bumpStreak } from './streakService.js'
import { estimateExercise, isAIConfigured, normalizeSearchKey } from './ai/exerciseEstimator.js'

// =====================================================
// EXERCISE LIBRARY (search + custom + usage stats)
// =====================================================

export async function searchExercises(query: string, userId: string, limit = 20) {
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

  return prisma.exercise.findMany({
    where: nameFilter ? { AND: [visibilityFilter, nameFilter] } : visibilityFilter,
    take: safeLimit,
    orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
  })
}

export async function getExercise(id: string, userId: string) {
  const ex = await prisma.exercise.findFirst({
    where: {
      id,
      OR: [{ isCustom: false }, { createdByUserId: userId }],
    },
  })
  if (!ex) throw new Error('Exercise not found')
  return ex
}

export async function createCustomExercise(
  userId: string,
  input: {
    name: string
    category: 'STRENGTH' | 'CARDIO' | 'FLEXIBILITY' | 'SPORTS' | 'BODYWEIGHT' | 'OTHER'
    primaryMuscles: string[]
    equipment?: string
    defaultUnit?: 'REPS' | 'TIME' | 'DISTANCE'
  }
) {
  return prisma.exercise.create({
    data: {
      name: input.name,
      category: input.category,
      primaryMuscles: input.primaryMuscles,
      equipment: input.equipment,
      defaultUnit: input.defaultUnit ?? 'REPS',
      isCustom: true,
      createdByUserId: userId,
      source: 'USER_CUSTOM',
    },
  })
}

/**
 * Hybrid exercise lookup: DB-first, AI fallback, cache result.
 * Same self-improving pattern as food lookup.
 */
export async function lookupOrEstimateExercise(
  query: string,
  userId: string
): Promise<{ exercise: import('@prisma/client').Exercise; source: 'DB' | 'AI'; aiAvailable: boolean }> {
  const trimmed = query.trim()
  if (!trimmed) throw new Error('Query is empty')

  const searchKey = normalizeSearchKey(trimmed)

  const cached = await prisma.exercise.findFirst({ where: { searchKey } })
  if (cached) {
    await prisma.exercise.update({
      where: { id: cached.id },
      data: { usageCount: { increment: 1 } },
    })
    return { exercise: cached, source: 'DB', aiAvailable: isAIConfigured() }
  }

  const fuzzy = await prisma.exercise.findFirst({
    where: {
      isCustom: false,
      name: { equals: trimmed, mode: 'insensitive' },
    },
  })
  if (fuzzy) {
    await prisma.exercise.update({
      where: { id: fuzzy.id },
      data: { searchKey, usageCount: { increment: 1 } },
    })
    return { exercise: fuzzy, source: 'DB', aiAvailable: isAIConfigured() }
  }

  if (!isAIConfigured()) {
    throw new Error('Exercise not found and AI estimation is not configured')
  }

  const estimate = await estimateExercise(trimmed)
  if (!estimate) throw new Error('AI estimation failed')

  const created = await prisma.exercise.create({
    data: {
      name: estimate.name,
      category: estimate.category,
      primaryMuscles: estimate.primaryMuscles,
      secondaryMuscles: estimate.secondaryMuscles,
      equipment: estimate.equipment,
      defaultUnit: estimate.defaultUnit,
      isCustom: false,
      source: 'AI_GENERATED',
      isVerified: false,
      searchKey,
      usageCount: 1,
      createdByUserId: userId,
    },
  })

  return { exercise: created, source: 'AI', aiAvailable: true }
}

// =====================================================
// SELF-IMPROVING SUGGESTIONS — adapts as user logs more
// =====================================================

/**
 * Frequently performed exercises by this user (last 60 days, top N).
 * Powers "Recent" pills in the workout dialog like calorie tracker.
 */
export async function getFrequentExercises(userId: string, limit = 8) {
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const grouped = await prisma.workoutExercise.groupBy({
    by: ['exerciseName', 'exerciseId'],
    where: {
      workout: { userId, loggedDate: { gte: sixtyDaysAgo } },
    },
    _count: true,
    orderBy: { _count: { exerciseName: 'desc' } },
    take: limit,
  })

  if (grouped.length === 0) return []

  const ids = grouped.map((g) => g.exerciseId).filter((x): x is string => !!x)
  const exercises = ids.length > 0 ? await prisma.exercise.findMany({ where: { id: { in: ids } } }) : []
  const byId = new Map(exercises.map((e) => [e.id, e]))

  return grouped
    .map((g) => {
      const ex = g.exerciseId ? byId.get(g.exerciseId) : null
      if (!ex) return null
      return { ...ex, frequency: g._count }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
}

/**
 * Last set for an exercise — used to pre-fill "previous" weights/reps in logger.
 * Strong/Hevy pattern: if you did 60kg×8 last time, dialog shows that as starting point.
 */
export async function getLastSetForExercise(userId: string, exerciseId: string) {
  return prisma.workoutSet.findFirst({
    where: {
      exerciseEntry: {
        exerciseId,
        workout: { userId },
      },
      isWarmup: false,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      exerciseEntry: {
        include: { workout: { select: { loggedDate: true } } },
      },
    },
  })
}

/**
 * Personal record check: is this set a PR (heaviest weight × reps for this exercise)?
 * Compared against all prior non-warmup sets for the same exercise+user.
 */
export async function isPersonalRecord(
  userId: string,
  exerciseId: string,
  weightKg: number | null,
  reps: number | null
): Promise<boolean> {
  if (!weightKg || !reps) return false

  // 1RM-style score: weight × (1 + reps/30) — Epley formula
  const newScore = weightKg * (1 + reps / 30)

  const priors = await prisma.workoutSet.findMany({
    where: {
      exerciseEntry: { exerciseId, workout: { userId } },
      isWarmup: false,
      weightKg: { not: null },
      reps: { not: null },
    },
    select: { weightKg: true, reps: true },
  })

  const maxPriorScore = priors.reduce((max, s) => {
    if (!s.weightKg || !s.reps) return max
    const score = Number(s.weightKg) * (1 + s.reps / 30)
    return score > max ? score : max
  }, 0)

  return newScore > maxPriorScore
}

// =====================================================
// LOGGING WORKOUTS
// =====================================================

export interface LogSetInput {
  exerciseId?: string
  exerciseName: string
  reps?: number
  weightKg?: number
  distanceKm?: number
  timeSeconds?: number
  rpe?: number
  isWarmup?: boolean
  notes?: string
}

export interface LogWorkoutInput {
  loggedDate?: Date
  workoutType: 'CARDIO' | 'STRENGTH' | 'FLEXIBILITY' | 'SPORTS' | 'OTHER'
  durationMin: number
  intensity: 'LIGHT' | 'MODERATE' | 'HIGH'
  notes?: string
  routineId?: string
  // Each entry = one exercise with multiple sets
  entries: Array<{
    exerciseId?: string
    exerciseName: string
    notes?: string
    sets: LogSetInput[]
  }>
}

/**
 * Create a workout with all sets. PR detection per set.
 * Updates exercise usage count for self-improvement loop.
 * Bumps user streak.
 */
export async function logWorkout(userId: string, orgId: string | null, input: LogWorkoutInput) {
  const loggedDate = input.loggedDate ?? new Date()

  const workout = await prisma.$transaction(async (tx) => {
    const w = await tx.workoutLog.create({
      data: {
        userId,
        orgId,
        loggedDate,
        workoutType: input.workoutType,
        durationMin: input.durationMin,
        intensity: input.intensity,
        notes: input.notes,
        routineId: input.routineId,
      },
    })

    for (let i = 0; i < input.entries.length; i++) {
      const entry = input.entries[i]!
      const exerciseEntry = await tx.workoutExercise.create({
        data: {
          workoutLogId: w.id,
          exerciseId: entry.exerciseId,
          exerciseName: entry.exerciseName,
          orderIndex: i,
          notes: entry.notes,
        },
      })

      for (let j = 0; j < entry.sets.length; j++) {
        const set = entry.sets[j]!
        // PR check (only for strength sets with weight + reps)
        const isPR =
          !set.isWarmup && set.weightKg && set.reps && entry.exerciseId
            ? await isPersonalRecord(userId, entry.exerciseId, set.weightKg, set.reps)
            : false

        await tx.workoutSet.create({
          data: {
            workoutExerciseId: exerciseEntry.id,
            setIndex: j + 1,
            reps: set.reps,
            weightKg: set.weightKg,
            distanceKm: set.distanceKm,
            timeSeconds: set.timeSeconds,
            rpe: set.rpe,
            isWarmup: set.isWarmup ?? false,
            isPR,
            notes: set.notes,
          },
        })
      }

      // Bump exercise usage count (self-improvement loop)
      if (entry.exerciseId) {
        await tx.exercise.update({
          where: { id: entry.exerciseId },
          data: { usageCount: { increment: 1 } },
        })
      }
    }

    // Bump routine usage if routine-based
    if (input.routineId) {
      await tx.routine.update({
        where: { id: input.routineId },
        data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
      })
    }

    return w
  })

  // Streak bump (best-effort)
  try {
    await bumpStreak(userId)
  } catch (err) {
    console.error('[streak] workout bump failed:', err)
  }

  return prisma.workoutLog.findUniqueOrThrow({
    where: { id: workout.id },
    include: {
      exercises: { include: { sets: true, exercise: true }, orderBy: { orderIndex: 'asc' } },
      routine: true,
    },
  })
}

export async function getWorkoutById(workoutId: string, userId: string) {
  const workout = await prisma.workoutLog.findFirst({
    where: { id: workoutId, userId },
    include: {
      exercises: { include: { sets: true, exercise: true }, orderBy: { orderIndex: 'asc' } },
      routine: true,
    },
  })
  if (!workout) throw new Error('Workout not found')
  return workout
}

export async function deleteWorkout(workoutId: string, userId: string) {
  const w = await prisma.workoutLog.findFirst({ where: { id: workoutId, userId } })
  if (!w) throw new Error('Workout not found')
  return prisma.workoutLog.delete({ where: { id: workoutId } })
}

/**
 * Daily breakdown — workouts logged that day.
 */
export async function getWorkoutsForDay(userId: string, date: Date) {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setHours(23, 59, 59, 999)

  return prisma.workoutLog.findMany({
    where: { userId, loggedDate: { gte: dayStart, lte: dayEnd } },
    include: {
      exercises: { include: { sets: true, exercise: true }, orderBy: { orderIndex: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Workout history list with pagination.
 */
export async function listWorkouts(userId: string, options: { page?: number; limit?: number } = {}) {
  const page = options.page ?? 1
  const limit = Math.min(options.limit ?? 20, 50)
  const skip = (page - 1) * limit

  const [workouts, total] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { userId },
      skip,
      take: limit,
      include: {
        exercises: {
          include: { sets: { select: { id: true, weightKg: true, reps: true, isPR: true } } },
        },
      },
      orderBy: { loggedDate: 'desc' },
    }),
    prisma.workoutLog.count({ where: { userId } }),
  ])

  return { workouts, total, page, limit }
}

/**
 * Weekly summary — total workouts, duration, calories burned.
 */
export async function getWeeklyStats(userId: string) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const workouts = await prisma.workoutLog.findMany({
    where: { userId, loggedDate: { gte: sevenDaysAgo } },
    select: { durationMin: true, caloriesBurned: true, workoutType: true },
  })

  return {
    count: workouts.length,
    totalMinutes: workouts.reduce((s, w) => s + w.durationMin, 0),
    totalCalories: workouts.reduce((s, w) => s + (w.caloriesBurned ?? 0), 0),
    byType: workouts.reduce<Record<string, number>>((acc, w) => {
      acc[w.workoutType] = (acc[w.workoutType] ?? 0) + 1
      return acc
    }, {}),
  }
}

// =====================================================
// ROUTINES (templates) — self-improving via usage tracking
// =====================================================

export async function listRoutines(userId: string) {
  return prisma.routine.findMany({
    where: { userId },
    include: { exercises: { orderBy: { orderIndex: 'asc' } } },
    orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function createRoutine(
  userId: string,
  input: {
    name: string
    description?: string
    exercises: Array<{
      exerciseId?: string
      exerciseName: string
      setScheme?: string
      notes?: string
    }>
  }
) {
  return prisma.$transaction(async (tx) => {
    const r = await tx.routine.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
      },
    })

    for (let i = 0; i < input.exercises.length; i++) {
      const ex = input.exercises[i]!
      await tx.routineExercise.create({
        data: {
          routineId: r.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          orderIndex: i,
          setScheme: ex.setScheme,
          notes: ex.notes,
        },
      })
    }

    return tx.routine.findUniqueOrThrow({
      where: { id: r.id },
      include: { exercises: { orderBy: { orderIndex: 'asc' } } },
    })
  })
}

export async function deleteRoutine(routineId: string, userId: string) {
  const r = await prisma.routine.findFirst({ where: { id: routineId, userId } })
  if (!r) throw new Error('Routine not found')
  return prisma.routine.delete({ where: { id: routineId } })
}

/**
 * AI-generated routine suggestions based on user's exercise history.
 * Picks user's most-frequent exercises, groups them into a sensible routine.
 *
 * Future: ML cluster analysis. For MVP: heuristic — top N strength exercises
 * grouped by primary muscle.
 */
export async function suggestRoutineFromHistory(userId: string): Promise<{
  name: string
  exercises: Array<{ exerciseId: string; exerciseName: string; setScheme: string }>
} | null> {
  const frequent = await getFrequentExercises(userId, 12)
  if (frequent.length < 3) return null // not enough history yet

  const strengthOnly = frequent.filter((e) => e.category === 'STRENGTH' || e.category === 'BODYWEIGHT')
  if (strengthOnly.length < 3) return null

  return {
    name: 'Your top exercises',
    exercises: strengthOnly.slice(0, 6).map((e) => ({
      exerciseId: e.id,
      exerciseName: e.name,
      setScheme: '3×8-12',
    })),
  }
}

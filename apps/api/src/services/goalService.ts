import { prisma } from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'

export type GoalType = 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'BUILD_ENDURANCE' | 'IMPROVE_FLEXIBILITY' | 'CUSTOM'
export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED'

export interface CreateGoalInput {
  goalType: GoalType
  targetValue: number
  targetUnit: string // "kg", "count", "minutes"
  startingValue: number
  targetDate: Date
  reason?: string
}

export async function createGoal(userId: string, orgId: string | null, input: CreateGoalInput) {
  return prisma.$transaction(async (tx) => {
    // Atomic: deactivate existing + create new in same transaction — no race window
    await tx.goal.updateMany({
      where: { userId, goalType: input.goalType, status: 'ACTIVE' },
      data: { status: 'PAUSED' },
    })

    return tx.goal.create({
      data: {
        userId,
        orgId,
        goalType: input.goalType,
        targetValue: input.targetValue,
        targetUnit: input.targetUnit,
        startingValue: input.startingValue,
        targetDate: input.targetDate,
        reason: input.reason,
        status: 'ACTIVE',
      },
    })
  })
}

export async function listGoals(userId: string, status?: GoalStatus) {
  return prisma.goal.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getGoal(goalId: string, userId: string) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } })
  if (!goal) throw new Error('Goal not found')
  return goal
}

export async function updateGoal(
  goalId: string,
  userId: string,
  updates: { status?: GoalStatus; targetValue?: number; targetDate?: Date; reason?: string }
) {
  await getGoal(goalId, userId)

  const data: Prisma.GoalUpdateInput = {}
  if (updates.status !== undefined) {
    data.status = updates.status
    if (updates.status === 'COMPLETED') data.completedAt = new Date()
  }
  if (updates.targetValue !== undefined) data.targetValue = updates.targetValue
  if (updates.targetDate !== undefined) data.targetDate = updates.targetDate
  if (updates.reason !== undefined) data.reason = updates.reason

  return prisma.goal.update({ where: { id: goalId }, data })
}

export async function deleteGoal(goalId: string, userId: string) {
  await getGoal(goalId, userId)
  return prisma.goal.delete({ where: { id: goalId } })
}

/**
 * Goal progress: current vs target.
 * For weight goals, latest weight metric is current. Other goals: manual progress.
 */
export async function getGoalProgress(goalId: string, userId: string) {
  const goal = await getGoal(goalId, userId)

  let currentValue: number | null = null
  if (goal.goalType === 'LOSE_WEIGHT' || goal.goalType === 'GAIN_MUSCLE') {
    const latestMetric = await prisma.healthMetric.findFirst({
      where: { userId, weightKg: { not: null } },
      orderBy: { metricDate: 'desc' },
    })
    if (latestMetric?.weightKg) currentValue = Number(latestMetric.weightKg)
  }

  const startingValue = Number(goal.startingValue)
  const targetValue = Number(goal.targetValue)
  const totalDelta = Math.abs(targetValue - startingValue)
  // Signed delta: positive means moving toward target, negative means regressing
  const progressDelta = currentValue !== null
    ? (targetValue > startingValue
        ? currentValue - startingValue   // gaining: higher is better
        : startingValue - currentValue)  // losing: lower is better
    : 0
  const percentComplete = totalDelta > 0 ? Math.min(100, Math.max(0, (progressDelta / totalDelta) * 100)) : 0

  const now = new Date()
  const daysRemaining = Math.max(
    0,
    Math.ceil((goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  )
  const totalDays = Math.max(
    1,
    Math.ceil((goal.targetDate.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  )
  const daysElapsed = totalDays - daysRemaining
  const expectedPercent = (daysElapsed / totalDays) * 100

  let pace: 'ahead' | 'on_track' | 'behind' = 'on_track'
  if (percentComplete > expectedPercent + 10) pace = 'ahead'
  else if (percentComplete < expectedPercent - 10) pace = 'behind'

  return {
    goal,
    currentValue,
    percentComplete,
    daysRemaining,
    daysElapsed,
    expectedPercent,
    pace,
  }
}

/**
 * Goal-driven daily calorie target. Overrides the basic Mifflin-St Jeor when active goal exists.
 *
 * Rules:
 * - LOSE_WEIGHT: BMR × activity − 500 kcal deficit
 * - GAIN_MUSCLE: BMR × activity + 300 kcal surplus + 1.6g protein/kg
 * - BUILD_ENDURANCE: BMR × activity (maintenance) + extra carbs
 * - JUST_TRACK / no goal: maintenance (BMR × 1.375)
 */
export async function getGoalAdjustedTarget(userId: string): Promise<{
  dailyCalorieTarget: number | null
  proteinTargetG: number | null
  goalType: string | null
}> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  if (!profile?.age || !profile.heightCm || !profile.currentWeightKg) {
    return { dailyCalorieTarget: null, proteinTargetG: null, goalType: profile?.primaryGoal ?? null }
  }

  const age = profile.age
  const heightCm = Number(profile.heightCm)
  const weightKg = Number(profile.currentWeightKg)
  const isMale = profile.gender === 'M'

  const bmr = isMale
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161

  const activeGoal = await prisma.goal.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })

  const goalType = activeGoal?.goalType ?? profile.primaryGoal ?? 'JUST_TRACK'
  const tdee = bmr * 1.375 // lightly active default

  let target = tdee
  let proteinG = weightKg * 1.2 // baseline 1.2 g/kg

  switch (goalType) {
    case 'LOSE_WEIGHT':
      target = tdee - 500
      proteinG = weightKg * 1.6 // higher protein for weight loss
      break
    case 'GAIN_MUSCLE':
      target = tdee + 300
      proteinG = weightKg * 1.8
      break
    case 'BUILD_ENDURANCE':
      target = tdee + 100 // small surplus for cardio recovery
      proteinG = weightKg * 1.4
      break
    case 'JUST_TRACK':
    case 'IMPROVE_FLEXIBILITY':
    case 'CUSTOM':
    default:
      target = tdee
      proteinG = weightKg * 1.2
  }

  return {
    dailyCalorieTarget: Math.round(target),
    proteinTargetG: Math.round(proteinG),
    goalType,
  }
}

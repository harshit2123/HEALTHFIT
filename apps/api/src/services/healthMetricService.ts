import { prisma } from '../lib/prisma.js'

export interface LogHealthMetricInput {
  metricDate?: Date
  weightKg?: number
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  notes?: string
}

/**
 * Log weight + body measurements. Auto-calculates BMI if heightCm in profile.
 * Also updates profile.currentWeightKg so calorie targets recalibrate.
 */
export async function logHealthMetric(userId: string, orgId: string | null, input: LogHealthMetricInput) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  let bmi: number | null = null
  if (input.weightKg && profile?.heightCm) {
    const heightM = Number(profile.heightCm) / 100
    bmi = Number((input.weightKg / (heightM * heightM)).toFixed(2))
  }

  const metric = await prisma.healthMetric.create({
    data: {
      userId,
      orgId,
      metricDate: input.metricDate ?? new Date(),
      weightKg: input.weightKg,
      bmi,
      chestCm: input.chestCm,
      waistCm: input.waistCm,
      hipsCm: input.hipsCm,
      notes: input.notes,
    },
  })

  // Sync current weight to profile (drives goal progress + calorie target)
  if (input.weightKg && profile) {
    await prisma.userProfile.update({
      where: { userId },
      data: { currentWeightKg: input.weightKg },
    })
  }

  return metric
}

export async function deleteHealthMetric(metricId: string, userId: string) {
  const m = await prisma.healthMetric.findFirst({ where: { id: metricId, userId } })
  if (!m) throw new Error('Metric not found')
  return prisma.healthMetric.delete({ where: { id: metricId } })
}

/**
 * Weight history time-series (for chart).
 */
export async function getWeightHistory(userId: string, days = 90) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const metrics = await prisma.healthMetric.findMany({
    where: { userId, weightKg: { not: null }, metricDate: { gte: since } },
    select: { id: true, metricDate: true, weightKg: true, bmi: true },
    orderBy: { metricDate: 'asc' },
  })

  return metrics.map((m) => ({
    id: m.id,
    date: m.metricDate.toISOString().slice(0, 10),
    weightKg: m.weightKg ? Number(m.weightKg) : null,
    bmi: m.bmi ? Number(m.bmi) : null,
  }))
}

/**
 * Latest measurements snapshot.
 */
export async function getLatestMetric(userId: string) {
  return prisma.healthMetric.findFirst({
    where: { userId },
    orderBy: { metricDate: 'desc' },
  })
}

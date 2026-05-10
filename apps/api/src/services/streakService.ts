import { prisma } from '../lib/prisma.js'

/**
 * Streak rules:
 * - Day = 24h block in user's TZ (default Asia/Kolkata)
 * - Increment if user logged ≥1 calorie OR ≥1 workout YESTERDAY (full day)
 * - Reset to 0 if more than 1 day passed since streakLastDate
 *
 * Called on every calorie/workout log to update streak in same transaction.
 */

function ymd(date: Date, tz: string = 'Asia/Kolkata'): string {
  // Format as YYYY-MM-DD in given timezone
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(date)
}

function daysBetween(a: string, b: string): number {
  const ad = new Date(`${a}T00:00:00Z`)
  const bd = new Date(`${b}T00:00:00Z`)
  return Math.round((bd.getTime() - ad.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Update streak for the user. Call on every log event.
 * Idempotent: multiple logs same day don't double-increment.
 */
export async function bumpStreak(userId: string): Promise<{ streakDays: number }> {
  // Wrap in transaction to prevent concurrent log events double-incrementing
  return prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.findUnique({ where: { userId } })
    if (!profile) return { streakDays: 0 }

    const tz = profile.timezone || 'Asia/Kolkata'
    const today = ymd(new Date(), tz)
    const lastDay = profile.streakLastDate ? ymd(profile.streakLastDate, tz) : null

    if (lastDay === today) {
      return { streakDays: profile.streakDays }
    }

    let newStreak: number
    if (!lastDay) {
      newStreak = 1
    } else {
      const gap = daysBetween(lastDay, today)
      if (gap === 1) {
        newStreak = profile.streakDays + 1
      } else if (gap > 1) {
        newStreak = 1
      } else {
        newStreak = profile.streakDays
      }
    }

    await tx.userProfile.update({
      where: { userId },
      data: { streakDays: newStreak, streakLastDate: new Date() },
    })

    return { streakDays: newStreak }
  })
}

export async function getStreak(userId: string): Promise<{
  streakDays: number
  streakLastDate: Date | null
  isActiveToday: boolean
}> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { streakDays: true, streakLastDate: true, timezone: true },
  })
  if (!profile) return { streakDays: 0, streakLastDate: null, isActiveToday: false }

  const tz = profile.timezone || 'Asia/Kolkata'
  const today = ymd(new Date(), tz)
  const lastDay = profile.streakLastDate ? ymd(profile.streakLastDate, tz) : null

  // If last log was 2+ days ago, streak is broken (display 0)
  let displayStreak = profile.streakDays
  if (lastDay) {
    const gap = daysBetween(lastDay, today)
    if (gap > 1) displayStreak = 0
  } else {
    displayStreak = 0
  }

  return {
    streakDays: displayStreak,
    streakLastDate: profile.streakLastDate,
    isActiveToday: lastDay === today,
  }
}

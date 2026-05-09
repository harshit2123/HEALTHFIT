import { prisma } from '../lib/prisma.js'

/**
 * Get current user's profile + subscription context.
 * Works for both B2B members (org subscription) and B2C individuals (personal trial/premium).
 */
export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      accountType: true,
      orgId: true,
      profile: true,
      org: {
        select: { id: true, name: true, logoUrl: true },
      },
      memberSub: {
        include: { plan: true },
      },
      personalSub: true,
      assignedToTrainer: {
        where: { isActive: true },
        include: {
          trainer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  return user
}

export async function updateMyProfile(
  userId: string,
  updates: {
    name?: string
    phone?: string
    age?: number
    gender?: string
    heightCm?: number
    currentWeightKg?: number
    fitnessLevel?: string
    timezone?: string
    language?: string
  }
) {
  const { name, phone, ...profileFields } = updates

  return prisma.$transaction(async (tx) => {
    if (name || phone) {
      await tx.user.update({
        where: { id: userId },
        data: { ...(name && { name }), ...(phone && { phone }) },
      })
    }

    if (Object.keys(profileFields).length > 0) {
      await tx.userProfile.upsert({
        where: { userId },
        create: { userId, ...profileFields },
        update: profileFields,
      })
    }

    return tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    })
  })
}

/**
 * Subscription summary for client portal header.
 * - B2B: org plan + days remaining
 * - B2C: trial status or premium tier
 */
export async function getMySubscription(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      memberSub: { include: { plan: true } },
      personalSub: true,
    },
  })

  if (user.accountType === 'B2B' && user.memberSub) {
    const sub = user.memberSub
    const now = new Date()
    const daysRemaining = Math.max(
      0,
      Math.ceil((sub.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    )

    return {
      type: 'B2B' as const,
      planName: sub.plan.name,
      status: sub.status,
      expiresAt: sub.expiresAt,
      daysRemaining,
      priceInr: sub.plan.priceInr,
    }
  }

  if (user.accountType === 'B2C' && user.personalSub) {
    const sub = user.personalSub
    const now = new Date()
    const endDate = sub.tier === 'TRIAL' ? sub.trialEndsAt : sub.premiumEndsAt
    const daysRemaining = endDate
      ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null

    return {
      type: 'B2C' as const,
      tier: sub.tier,
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      premiumEndsAt: sub.premiumEndsAt,
      daysRemaining,
    }
  }

  return null
}

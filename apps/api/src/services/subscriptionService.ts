import { prisma } from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'

// =====================================================
// SUBSCRIPTION PLANS (B2B - Org-managed)
// =====================================================

export interface CreatePlanInput {
  name: string
  description?: string
  priceInr: number
  durationDays: number
  features?: Array<{ key: string; label: string; enabled: boolean }>
  memberCapacity?: number
}

export async function createPlan(orgId: string, input: CreatePlanInput) {
  return prisma.subscriptionPlan.create({
    data: {
      orgId,
      name: input.name,
      description: input.description,
      priceInr: input.priceInr,
      durationDays: input.durationDays,
      features: (input.features ?? []) as unknown as Prisma.InputJsonValue,
      memberCapacity: input.memberCapacity,
    },
  })
}

export async function listPlans(orgId: string, includeArchived = false) {
  return prisma.subscriptionPlan.findMany({
    where: {
      orgId,
      ...(includeArchived ? {} : { isActive: true }),
    },
    include: {
      _count: {
        select: {
          subscriptions: { where: { status: { in: ['ACTIVE', 'TRIAL', 'EXPIRING'] } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPlan(planId: string, orgId: string) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: planId, orgId },
    include: {
      _count: {
        select: {
          subscriptions: { where: { status: { in: ['ACTIVE', 'TRIAL', 'EXPIRING'] } } },
        },
      },
    },
  })
  if (!plan) throw new Error('Plan not found')
  return plan
}

export async function updatePlan(
  planId: string,
  orgId: string,
  updates: Partial<CreatePlanInput> & { isActive?: boolean }
) {
  // Verify ownership before update
  const existing = await prisma.subscriptionPlan.findFirst({ where: { id: planId, orgId } })
  if (!existing) throw new Error('Plan not found')

  return prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.priceInr !== undefined && { priceInr: updates.priceInr }),
      ...(updates.durationDays !== undefined && { durationDays: updates.durationDays }),
      ...(updates.features !== undefined && {
        features: updates.features as unknown as Prisma.InputJsonValue,
      }),
      ...(updates.memberCapacity !== undefined && { memberCapacity: updates.memberCapacity }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
    },
  })
}

export async function archivePlan(planId: string, orgId: string) {
  const existing = await prisma.subscriptionPlan.findFirst({ where: { id: planId, orgId } })
  if (!existing) throw new Error('Plan not found')

  // Don't delete — archive. Existing subscriptions stay valid until expiry.
  return prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { isActive: false },
  })
}

// =====================================================
// MEMBER SUBSCRIPTIONS (B2B - assigning plans to members)
// =====================================================

/**
 * Assign or renew a subscription for a member.
 * If member has active sub → extends from current expiry.
 * If member has expired sub → starts fresh from now.
 * If member has no sub → creates new.
 */
export async function assignOrRenewSubscription(
  memberId: string,
  orgId: string,
  planId: string,
  amountPaidInr: number
) {
  return prisma.$transaction(async (tx) => {
    const member = await tx.user.findFirst({ where: { id: memberId, orgId, role: 'ORG_MEMBER' } })
    if (!member) throw new Error('Member not found in org')

    const plan = await tx.subscriptionPlan.findFirst({ where: { id: planId, orgId, isActive: true } })
    if (!plan) throw new Error('Plan not found or archived')

    // Atomic capacity check inside transaction — no TOCTOU race window
    if (plan.memberCapacity !== null) {
      const activeCount = await tx.memberSubscription.count({
        where: { planId, status: { notIn: ['EXPIRED', 'CANCELLED'] } },
      })
      if (activeCount >= plan.memberCapacity) {
        throw new Error('Plan member capacity reached')
      }
    }

    const now = new Date()
    const existing = await tx.memberSubscription.findUnique({ where: { memberId } })

    let newExpiresAt: Date
    if (existing && existing.expiresAt > now && existing.status !== 'CANCELLED') {
      newExpiresAt = new Date(existing.expiresAt)
      newExpiresAt.setDate(newExpiresAt.getDate() + plan.durationDays)
    } else {
      newExpiresAt = new Date(now)
      newExpiresAt.setDate(newExpiresAt.getDate() + plan.durationDays)
    }

    if (existing) {
      return tx.memberSubscription.update({
        where: { memberId },
        data: {
          planId,
          startedAt: existing.expiresAt > now ? existing.startedAt : now,
          expiresAt: newExpiresAt,
          status: 'ACTIVE',
          amountPaidInr: { increment: amountPaidInr },
        },
        include: { plan: true },
      })
    }

    return tx.memberSubscription.create({
      data: { memberId, orgId, planId, startedAt: now, expiresAt: newExpiresAt, status: 'ACTIVE', amountPaidInr },
      include: { plan: true },
    })
  })
}

export async function cancelMemberSubscription(memberId: string, orgId: string) {
  const result = await prisma.memberSubscription.updateMany({
    where: { memberId, orgId },
    data: { status: 'CANCELLED' },
  })
  if (result.count === 0) throw new Error('Subscription not found')
}

/**
 * List all member subscriptions in an org with filters for the admin dashboard.
 */
export async function listOrgSubscriptions(
  orgId: string,
  options: {
    status?: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED'
    expiringWithinDays?: number
  } = {}
) {
  const where: Prisma.MemberSubscriptionWhereInput = { orgId }

  if (options.status) {
    where.status = options.status
  }

  if (options.expiringWithinDays) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + options.expiringWithinDays)
    where.expiresAt = { lte: cutoff }
    where.status = { in: ['ACTIVE', 'EXPIRING'] }
  }

  return prisma.memberSubscription.findMany({
    where,
    include: {
      member: { select: { id: true, name: true, email: true, phone: true } },
      plan: { select: { id: true, name: true, priceInr: true } },
    },
    orderBy: { expiresAt: 'asc' },
  })
}

// =====================================================
// EXPIRY MAINTENANCE — run as scheduled job
// Marks ACTIVE → EXPIRING (≤7 days) and EXPIRING → EXPIRED (past expiry)
// =====================================================

export async function processExpiringSubscriptions() {
  const now = new Date()
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  // Mark soon-to-expire as EXPIRING (so admin dashboard can flag them)
  const markedExpiring = await prisma.memberSubscription.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { gt: now, lte: sevenDaysFromNow },
    },
    data: { status: 'EXPIRING' },
  })

  // Mark past-expiry as EXPIRED
  const markedExpired = await prisma.memberSubscription.updateMany({
    where: {
      status: { in: ['ACTIVE', 'EXPIRING'] },
      expiresAt: { lte: now },
    },
    data: { status: 'EXPIRED' },
  })

  return {
    markedExpiring: markedExpiring.count,
    markedExpired: markedExpired.count,
  }
}

// =====================================================
// PERSONAL SUBSCRIPTIONS (B2C - trial/premium)
// =====================================================

export async function getPersonalSubscription(userId: string) {
  return prisma.personalSubscription.findUnique({ where: { userId } })
}

/**
 * Upgrade B2C user from TRIAL/FREE to PREMIUM.
 * Currently no payment integration (Phase 3 deferred from MVP).
 * Premium duration: 1 month from now.
 */
export async function upgradeToPremium(userId: string, durationMonths = 1) {
  const sub = await prisma.personalSubscription.findUnique({ where: { userId } })
  if (!sub) throw new Error('Personal subscription not found')

  const now = new Date()

  // If already premium and not expired, extend from current expiry
  let premiumEndsAt: Date
  if (sub.tier === 'PREMIUM' && sub.premiumEndsAt && sub.premiumEndsAt > now) {
    premiumEndsAt = new Date(sub.premiumEndsAt)
    premiumEndsAt.setMonth(premiumEndsAt.getMonth() + durationMonths)
  } else {
    premiumEndsAt = new Date(now)
    premiumEndsAt.setMonth(premiumEndsAt.getMonth() + durationMonths)
  }

  return prisma.personalSubscription.update({
    where: { userId },
    data: {
      tier: 'PREMIUM',
      premiumStartedAt: sub.premiumStartedAt ?? now,
      premiumEndsAt,
      status: 'ACTIVE',
    },
  })
}

export async function cancelPremium(userId: string) {
  const sub = await prisma.personalSubscription.findUnique({ where: { userId } })
  if (!sub) throw new Error('Personal subscription not found')

  // Don't immediately downgrade — let them use until premium ends
  return prisma.personalSubscription.update({
    where: { userId },
    data: { autoRenew: false, status: 'CANCELLED' },
  })
}

/**
 * Process B2C trial expirations.
 * TRIAL → FREE when trialEndsAt passes (gives them limited access).
 * PREMIUM → expired status when premiumEndsAt passes.
 */
export async function processPersonalSubscriptions() {
  const now = new Date()

  const trialsToExpire = await prisma.personalSubscription.updateMany({
    where: {
      tier: 'TRIAL',
      trialEndsAt: { lte: now },
    },
    data: { tier: 'FREE', status: 'EXPIRED' },
  })

  const premiumToExpire = await prisma.personalSubscription.updateMany({
    where: {
      tier: 'PREMIUM',
      premiumEndsAt: { lte: now },
      autoRenew: false,
    },
    data: { tier: 'FREE', status: 'EXPIRED' },
  })

  return {
    trialsExpired: trialsToExpire.count,
    premiumExpired: premiumToExpire.count,
  }
}

import { Router } from 'express'
import { z } from 'zod'
import { requireOrgScope } from '../middleware/orgScope.js'
import { requireRole } from '../middleware/requireRole.js'
import { parseDate, parsePositiveInt } from '../lib/validation.js'
import {
  createMember,
  listMembers,
  getMemberById,
  updateMember,
  deactivateMember,
  getConversionLeaderboard,
} from '../services/memberService.js'
import {
  createTrainer,
  listTrainers,
  assignMemberToTrainer,
  unassignMember,
  getMyAssignedMembers,
} from '../services/trainerService.js'
import { prisma } from '../lib/prisma.js'

export const adminRouter = Router()

adminRouter.use(requireOrgScope)

// ==================== ORG INFO ====================

adminRouter.get('/org', async (req, res, next) => {
  try {
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: req.user!.orgId! },
      include: {
        _count: {
          select: {
            members: { where: { role: 'ORG_MEMBER', isActive: true } },
            subscriptionPlans: { where: { isActive: true } },
          },
        },
      },
    })
    res.json({ success: true, data: org, error: null })
  } catch (err) {
    next(err)
  }
})

// ==================== MEMBERS ====================

const createMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: z.string().optional(),
  heightCm: z.number().min(50).max(300).optional(),
  currentWeightKg: z.number().min(20).max(500).optional(),
  fitnessLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
})

const updateMemberSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
})

// List members (Owner: all org, Trainer: assigned only)
adminRouter.get('/members', async (req, res, next) => {
  try {
    const result = await listMembers(
      req.user!.orgId!,
      req.user!.role as 'ORG_OWNER' | 'TRAINER',
      req.user!.userId,
      {
        page: req.query['page'] ? Number(req.query['page']) : undefined,
        limit: req.query['limit'] ? Number(req.query['limit']) : undefined,
        search: typeof req.query['search'] === 'string' ? req.query['search'] : undefined,
        trainerId:
          typeof req.query['trainerId'] === 'string' ? req.query['trainerId'] : undefined,
        status:
          req.query['status'] === 'ACTIVE' || req.query['status'] === 'INACTIVE'
            ? req.query['status']
            : undefined,
      }
    )
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    next(err)
  }
})

// Get single member detail
adminRouter.get('/members/:id', async (req, res, next) => {
  try {
    const member = await getMemberById(
      req.params['id']!,
      req.user!.orgId!,
      req.user!.role as 'ORG_OWNER' | 'TRAINER',
      req.user!.userId
    )
    res.json({ success: true, data: member, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Member not found or access denied') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// Create member: ORG_OWNER and TRAINER both allowed.
// Trainers auto-self-assign to the new member.
adminRouter.post('/members', async (req, res, next) => {
  try {
    const role = req.user!.role
    if (role !== 'ORG_OWNER' && role !== 'TRAINER') {
      res.status(403).json({ success: false, data: null, error: 'Insufficient permissions' })
      return
    }
    const parsed = createMemberSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const member = await createMember(
      req.user!.orgId!,
      req.user!.userId,
      role,
      parsed.data
    )
    res.status(201).json({ success: true, data: member, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Email already registered') {
      res.status(409).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// Update member
adminRouter.patch('/members/:id', async (req, res, next) => {
  try {
    const parsed = updateMemberSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const updated = await updateMember(
      req.params['id']!,
      req.user!.orgId!,
      req.user!.role as 'ORG_OWNER' | 'TRAINER',
      req.user!.userId,
      parsed.data
    )
    res.json({ success: true, data: updated, error: null })
  } catch (err) {
    if (err instanceof Error && (err.message === 'Access denied' || err.message === 'Trainers cannot deactivate members')) {
      res.status(403).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// Deactivate member (Owner only)
adminRouter.delete('/members/:id', requireRole(['ORG_OWNER']), async (req, res, next) => {
  try {
    await deactivateMember(req.params['id']!, req.user!.orgId!)
    res.json({ success: true, data: null, error: null })
  } catch (err) {
    next(err)
  }
})

// ==================== TRAINERS (Owner only) ====================

const createTrainerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
})

adminRouter.get('/trainers', requireRole(['ORG_OWNER']), async (req, res, next) => {
  try {
    const trainers = await listTrainers(req.user!.orgId!)
    res.json({ success: true, data: trainers, error: null })
  } catch (err) {
    next(err)
  }
})

adminRouter.post('/trainers', requireRole(['ORG_OWNER']), async (req, res, next) => {
  try {
    const parsed = createTrainerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const trainer = await createTrainer(req.user!.orgId!, parsed.data)
    res.status(201).json({ success: true, data: trainer, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Email already registered') {
      res.status(409).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// Assign member to trainer (Owner only)
adminRouter.post('/trainers/:trainerId/members/:memberId', requireRole(['ORG_OWNER']), async (req, res, next) => {
  try {
    const result = await assignMemberToTrainer(
      req.params['trainerId']!,
      req.params['memberId']!,
      req.user!.orgId!
    )
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    if (err instanceof Error) {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

adminRouter.delete('/trainers/:trainerId/members/:memberId', requireRole(['ORG_OWNER']), async (req, res, next) => {
  try {
    await unassignMember(req.params['trainerId']!, req.params['memberId']!, req.user!.orgId!)
    res.json({ success: true, data: null, error: null })
  } catch (err) {
    next(err)
  }
})

// Owner-only conversion leaderboard
// Optional ?since=ISO_DATE to filter (e.g. last 30 days)
adminRouter.get('/conversions', requireRole(['ORG_OWNER']), async (req, res, next) => {
  try {
    const sinceParam = typeof req.query['since'] === 'string' ? req.query['since'] : undefined
    if (sinceParam && !parseDate(sinceParam)) {
      res.status(400).json({ success: false, data: null, error: 'Invalid since date format' })
      return
    }
    const since = sinceParam ? parseDate(sinceParam)! : undefined
    const result = await getConversionLeaderboard(req.user!.orgId!, { since })
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    next(err)
  }
})

// Trainer's own assigned members
adminRouter.get('/my-members', requireRole(['TRAINER']), async (req, res, next) => {
  try {
    const members = await getMyAssignedMembers(req.user!.userId)
    res.json({ success: true, data: members, error: null })
  } catch (err) {
    next(err)
  }
})

// ==================== SUBSCRIPTION PLANS (Owner only) ====================

import {
  createPlan,
  listPlans,
  getPlan,
  updatePlan,
  archivePlan,
  assignOrRenewSubscription,
  cancelMemberSubscription,
  listOrgSubscriptions,
} from '../services/subscriptionService.js'

const planSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  priceInr: z.number().nonnegative(),
  durationDays: z.number().int().positive(),
  features: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        enabled: z.boolean(),
      })
    )
    .optional(),
  memberCapacity: z.number().int().positive().optional(),
})

const updatePlanSchema = planSchema.partial().extend({
  isActive: z.boolean().optional(),
})

adminRouter.get('/subscriptions', async (req, res, next) => {
  try {
    const includeArchived = req.query['includeArchived'] === 'true'
    const plans = await listPlans(req.user!.orgId!, includeArchived)
    res.json({ success: true, data: plans, error: null })
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/subscriptions/:id', async (req, res, next) => {
  try {
    const plan = await getPlan(req.params['id']!, req.user!.orgId!)
    res.json({ success: true, data: plan, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Plan not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

adminRouter.post('/subscriptions', requireRole(['ORG_OWNER']), async (req, res, next) => {
  try {
    const parsed = planSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const plan = await createPlan(req.user!.orgId!, parsed.data)
    res.status(201).json({ success: true, data: plan, error: null })
  } catch (err) {
    next(err)
  }
})

adminRouter.patch('/subscriptions/:id', requireRole(['ORG_OWNER']), async (req, res, next) => {
  try {
    const parsed = updatePlanSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }
    const plan = await updatePlan(req.params['id']!, req.user!.orgId!, parsed.data)
    res.json({ success: true, data: plan, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Plan not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

adminRouter.delete('/subscriptions/:id', requireRole(['ORG_OWNER']), async (req, res, next) => {
  try {
    await archivePlan(req.params['id']!, req.user!.orgId!)
    res.json({ success: true, data: null, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Plan not found') {
      res.status(404).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// ==================== MEMBER SUBSCRIPTION ASSIGNMENT ====================

const assignSubSchema = z.object({
  planId: z.string().uuid(),
  amountPaidInr: z.number().nonnegative(),
})

// Assign or renew a subscription for a member
adminRouter.post(
  '/members/:memberId/subscription',
  requireRole(['ORG_OWNER']),
  async (req, res, next) => {
    try {
      const parsed = assignSubSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
        return
      }
      const sub = await assignOrRenewSubscription(
        req.params['memberId']!,
        req.user!.orgId!,
        parsed.data.planId,
        parsed.data.amountPaidInr
      )
      res.json({ success: true, data: sub, error: null })
    } catch (err) {
      if (err instanceof Error && (err.message === 'Member not found in org' || err.message === 'Plan not found or archived' || err.message === 'Plan member capacity reached')) {
        res.status(404).json({ success: false, data: null, error: err.message })
        return
      }
      next(err)
    }
  }
)

adminRouter.delete(
  '/members/:memberId/subscription',
  requireRole(['ORG_OWNER']),
  async (req, res, next) => {
    try {
      const sub = await cancelMemberSubscription(req.params['memberId']!, req.user!.orgId!)
      res.json({ success: true, data: sub, error: null })
    } catch (err) {
      if (err instanceof Error && err.message === 'Subscription not found') {
        res.status(404).json({ success: false, data: null, error: err.message })
        return
      }
      next(err)
    }
  }
)

// List all org subscriptions with optional filters
adminRouter.get('/member-subscriptions', async (req, res, next) => {
  try {
    const status = req.query['status']
    const expiringWithinDays = req.query['expiringWithinDays']
      ? parsePositiveInt(req.query['expiringWithinDays'] as string, 0, 365) || undefined
      : undefined

    const subs = await listOrgSubscriptions(req.user!.orgId!, {
      status:
        status === 'ACTIVE' || status === 'EXPIRING' || status === 'EXPIRED' || status === 'CANCELLED'
          ? status
          : undefined,
      expiringWithinDays,
    })
    res.json({ success: true, data: subs, error: null })
  } catch (err) {
    next(err)
  }
})

// ==================== NOTIFICATIONS ====================

import {
  sendNotification,
  listNotifications,
  getProviderStatus,
} from '../services/notification/notificationService.js'
import { NOTIFICATION_TEMPLATES } from '../services/notification/types.js'

const sendNotificationSchema = z
  .object({
    recipientIds: z.array(z.string().uuid()).min(1),
    channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL', 'IN_APP']),
    templateKey: z
      .enum(
        Object.keys(NOTIFICATION_TEMPLATES) as [keyof typeof NOTIFICATION_TEMPLATES, ...Array<keyof typeof NOTIFICATION_TEMPLATES>]
      )
      .optional(),
    customMessage: z.string().min(1).optional(),
    scheduledFor: z.string().datetime().optional(),
  })
  .refine((d) => d.templateKey || d.customMessage, {
    message: 'Either templateKey or customMessage is required',
  })

adminRouter.post('/notifications', requireRole(['ORG_OWNER']), async (req, res, next) => {
  try {
    const parsed = sendNotificationSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }

    // Verify all recipientIds belong to this org
    const validCount = await prisma.user.count({
      where: {
        id: { in: parsed.data.recipientIds },
        orgId: req.user!.orgId!,
      },
    })
    if (validCount !== parsed.data.recipientIds.length) {
      res.status(403).json({ success: false, data: null, error: 'Some recipients are not in your organization' })
      return
    }

    const notif = await sendNotification({
      orgId: req.user!.orgId!,
      recipientIds: parsed.data.recipientIds,
      channel: parsed.data.channel,
      templateKey: parsed.data.templateKey,
      customMessage: parsed.data.customMessage,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null,
    })

    res.status(201).json({ success: true, data: notif, error: null })
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/notifications', async (req, res, next) => {
  try {
    const limit = Math.min(req.query['limit'] ? Number(req.query['limit']) : 50, 200)
    const notifs = await listNotifications(req.user!.orgId!, limit)
    res.json({ success: true, data: notifs, error: null })
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/notifications/templates', (_req, res) => {
  const templates = Object.entries(NOTIFICATION_TEMPLATES).map(([key, val]) => ({
    key,
    name: val.name,
    message: val.message,
  }))
  res.json({ success: true, data: templates, error: null })
})

adminRouter.get('/notifications/providers', (_req, res) => {
  res.json({ success: true, data: getProviderStatus(), error: null })
})

// ==================== STUBS ====================

adminRouter.get('/analytics', (_req, res) => {
  res.json({ success: true, data: { message: 'Org analytics — Phase 7' }, error: null })
})

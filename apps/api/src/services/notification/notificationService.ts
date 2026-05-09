import { prisma } from '../../lib/prisma.js'
import type { Prisma } from '@prisma/client'
import {
  NOTIFICATION_TEMPLATES,
  renderTemplate,
  type NotificationProvider,
  type NotificationPayload,
  type TemplateKey,
} from './types.js'
import { whatsappProvider } from './whatsappProvider.js'
import { smsProvider } from './smsProvider.js'
import { emailProvider } from './emailProvider.js'

const PROVIDERS: Record<string, NotificationProvider> = {
  WHATSAPP: whatsappProvider,
  SMS: smsProvider,
  EMAIL: emailProvider,
}

export type Channel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'IN_APP'

export interface SendNotificationInput {
  orgId: string
  recipientIds: string[] // member userIds
  channel: Channel
  // Either template + vars OR raw message
  templateKey?: TemplateKey
  templateVars?: Record<string, string>
  customMessage?: string
  scheduledFor?: Date | null
}

interface ResolvedRecipient {
  userId: string
  name: string
  email: string
  phone: string | null
  // per-recipient template vars (gym name, plan name, etc. resolved at send time)
  vars: Record<string, string>
}

/**
 * Create a notification record + dispatch immediately or schedule for later.
 */
export async function sendNotification(input: SendNotificationInput) {
  if (input.recipientIds.length === 0) {
    throw new Error('At least one recipient required')
  }

  if (!input.templateKey && !input.customMessage) {
    throw new Error('Either templateKey or customMessage is required')
  }

  // Resolve message (raw or templated, base — per-recipient vars applied at dispatch)
  const baseMessage =
    input.customMessage ?? NOTIFICATION_TEMPLATES[input.templateKey!].message

  // Persist a Notification record for tracking + retries
  const notif = await prisma.notification.create({
    data: {
      orgId: input.orgId,
      templateName: input.templateKey ?? 'CUSTOM',
      recipientIds: input.recipientIds as unknown as Prisma.InputJsonValue,
      messageText: baseMessage,
      channel: input.channel,
      scheduledFor: input.scheduledFor ?? null,
      status: input.scheduledFor && input.scheduledFor > new Date() ? 'SCHEDULED' : 'PENDING',
    },
  })

  // If scheduled for future, return without sending (expiry job will pick it up)
  if (notif.status === 'SCHEDULED') return notif

  // Otherwise, dispatch immediately
  await dispatchNotification(notif.id)
  return prisma.notification.findUniqueOrThrow({ where: { id: notif.id } })
}

/**
 * Pick up a pending notification and send to all recipients.
 * Marks notification as SENT or FAILED based on overall result.
 */
export async function dispatchNotification(notificationId: string): Promise<void> {
  const notif = await prisma.notification.findUniqueOrThrow({
    where: { id: notificationId },
    include: { org: true },
  })

  if (notif.status === 'SENT') return // idempotent

  const recipientIds = notif.recipientIds as unknown as string[]
  const recipients = await loadRecipients(recipientIds, notif.org.name)
  const provider = PROVIDERS[notif.channel]

  if (!provider) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'FAILED', failureReason: `No provider for channel ${notif.channel}` },
    })
    return
  }

  let firstProviderId: string | undefined
  let allFailed = true
  let firstError: string | undefined

  // Send to each recipient. We're not parallelizing here for simple rate-limiting.
  // Phase 4+ moves to BullMQ for proper concurrent dispatch + retry.
  for (const recipient of recipients) {
    const personalizedMessage = renderTemplate(notif.messageText, recipient.vars)
    const payload: NotificationPayload = {
      recipient: {
        userId: recipient.userId,
        name: recipient.name,
        phone: recipient.phone,
        email: recipient.email,
      },
      message: personalizedMessage,
      templateName: notif.templateName ?? undefined,
    }

    const result = await provider.send(payload)

    if (result.success) {
      allFailed = false
      if (!firstProviderId) firstProviderId = result.providerId
    } else if (!firstError) {
      firstError = result.error
    }
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: allFailed ? 'FAILED' : 'SENT',
      sentAt: new Date(),
      failureReason: allFailed ? firstError : null,
      whatsappMsgId: notif.channel === 'WHATSAPP' ? firstProviderId : null,
    },
  })
}

async function loadRecipients(userIds: string[], gymName: string): Promise<ResolvedRecipient[]> {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: {
      memberSub: { include: { plan: true } },
    },
  })

  return users.map((u) => ({
    userId: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    vars: {
      name: u.name.split(' ')[0] || u.name,
      gymName,
      planName: u.memberSub?.plan.name ?? 'Membership',
      expiryDate: u.memberSub?.expiresAt
        ? new Date(u.memberSub.expiresAt).toLocaleDateString('en-IN')
        : '',
      loginUrl: process.env['CLIENT_URL'] ?? 'https://app.spacefit.in',
    },
  }))
}

/**
 * Process scheduled notifications whose scheduledFor has passed.
 * Called from expiry job hourly.
 */
export async function processScheduledNotifications() {
  const due = await prisma.notification.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: { lte: new Date() },
    },
    take: 100, // batch limit
  })

  for (const notif of due) {
    try {
      await dispatchNotification(notif.id)
    } catch (err) {
      console.error(`[notify] Failed to dispatch ${notif.id}:`, err)
    }
  }

  return { dispatched: due.length }
}

/**
 * Auto-fire expiry reminders for B2B subscriptions at 7/3/1 days out.
 * Runs from expiry job daily.
 */
export async function sendExpiryReminders() {
  const now = new Date()

  for (const daysOut of [7, 3, 1] as const) {
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() + daysOut)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const expiringSubs = await prisma.memberSubscription.findMany({
      where: {
        expiresAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['ACTIVE', 'EXPIRING'] },
      },
      include: { org: true, member: true },
    })

    // Group by org for one notification per org per day
    const byOrg = new Map<string, { orgName: string; memberIds: string[] }>()
    for (const sub of expiringSubs) {
      if (!byOrg.has(sub.orgId)) {
        byOrg.set(sub.orgId, { orgName: sub.org.name, memberIds: [] })
      }
      byOrg.get(sub.orgId)!.memberIds.push(sub.memberId)
    }

    const templateKey = (`EXPIRY_${daysOut}_DAY${daysOut === 1 ? '' : 'S'}`) as TemplateKey

    for (const [orgId, data] of byOrg.entries()) {
      // Avoid double-sending: check if reminder for these members on this day was already queued/sent
      const existingToday = await prisma.notification.findFirst({
        where: {
          orgId,
          templateName: templateKey,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      })
      if (existingToday) continue

      try {
        await sendNotification({
          orgId,
          recipientIds: data.memberIds,
          channel: 'WHATSAPP',
          templateKey,
        })
      } catch (err) {
        console.error(`[expiry-reminder] Org ${orgId} failed:`, err)
      }
    }
  }
}

/**
 * Notification history for an org (admin dashboard).
 */
export async function listNotifications(orgId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export function getProviderStatus(): Array<{ channel: Channel; configured: boolean }> {
  return [
    { channel: 'WHATSAPP', configured: whatsappProvider.isConfigured },
    { channel: 'SMS', configured: smsProvider.isConfigured },
    { channel: 'EMAIL', configured: emailProvider.isConfigured },
    { channel: 'IN_APP', configured: true }, // always available
  ]
}

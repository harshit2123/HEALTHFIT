import {
  processExpiringSubscriptions,
  processPersonalSubscriptions,
} from './subscriptionService.js'
import {
  processScheduledNotifications,
  sendExpiryReminders,
} from './notification/notificationService.js'

/**
 * Subscription expiry processor.
 * Runs every hour to:
 * - Mark B2B subs ACTIVE → EXPIRING (≤7 days remaining) for admin alerts
 * - Mark B2B subs EXPIRING → EXPIRED (past expiry)
 * - Mark B2C trials TRIAL → FREE when trialEndsAt passes
 * - Mark B2C premium PREMIUM → FREE when premiumEndsAt passes (and autoRenew=false)
 *
 * NOTE: This is a simple in-process job. For production scale (10K+ users),
 * move to BullMQ + Redis in Phase 4 so it runs in a separate worker.
 */
const ONE_HOUR_MS = 60 * 60 * 1000

let intervalHandle: NodeJS.Timeout | null = null

let lastDailyReminderRun: string | null = null // YYYY-MM-DD

async function runExpiryProcessing() {
  try {
    const [b2b, b2c, scheduled] = await Promise.all([
      processExpiringSubscriptions(),
      processPersonalSubscriptions(),
      processScheduledNotifications(),
    ])

    if (b2b.markedExpiring > 0 || b2b.markedExpired > 0) {
      console.log(
        `[expiry] B2B: ${b2b.markedExpiring} marked expiring, ${b2b.markedExpired} expired`
      )
    }
    if (b2c.trialsExpired > 0 || b2c.premiumExpired > 0) {
      console.log(
        `[expiry] B2C: ${b2c.trialsExpired} trials expired, ${b2c.premiumExpired} premium expired`
      )
    }
    if (scheduled.dispatched > 0) {
      console.log(`[expiry] Dispatched ${scheduled.dispatched} scheduled notifications`)
    }

    // Auto-send expiry reminders once per day (idempotent inside service)
    const today = new Date().toISOString().slice(0, 10)
    if (lastDailyReminderRun !== today) {
      await sendExpiryReminders()
      lastDailyReminderRun = today
    }
  } catch (err) {
    console.error('[expiry] Job failed:', err)
  }
}

export function startExpiryJob() {
  if (intervalHandle) return // idempotent
  console.log('[expiry] Starting hourly expiry job')

  // Run once at startup so anything past-due gets caught immediately
  void runExpiryProcessing()

  intervalHandle = setInterval(() => {
    void runExpiryProcessing()
  }, ONE_HOUR_MS)
}

export function stopExpiryJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}

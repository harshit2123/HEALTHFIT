import type { NotificationProvider, NotificationPayload, ProviderResult } from './types.js'

/**
 * Resend email provider (simpler than SendGrid; same use-case).
 *
 * Required env:
 * - RESEND_API_KEY
 * - EMAIL_FROM (e.g. "Spacefit <noreply@spacefit.app>")
 */
class EmailProvider implements NotificationProvider {
  readonly channel = 'EMAIL' as const

  get isConfigured(): boolean {
    return !!(process.env['RESEND_API_KEY'] && process.env['EMAIL_FROM'])
  }

  async send(payload: NotificationPayload): Promise<ProviderResult> {
    const { recipient, message, templateName } = payload

    if (!this.isConfigured) {
      console.log(`[Email:SIM] → ${recipient.email}: ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`)
      return {
        success: true,
        providerId: `sim_email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        simulated: true,
      }
    }

    const subject = templateName ?? 'Spacefit notification'
    // Plain message → simple HTML wrapper
    const html = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#374151">
      <h2 style="margin-top:0;color:#6366f1">Spacefit</h2>
      <p style="line-height:1.6">${message.replace(/\n/g, '<br>')}</p>
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#9ca3af">Sent via Spacefit. Reply STOP to unsubscribe.</p>
    </div>`

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env['RESEND_API_KEY']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env['EMAIL_FROM'],
          to: recipient.email,
          subject,
          html,
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        return { success: false, error: `Resend ${res.status}: ${errBody.slice(0, 200)}` }
      }

      const json = (await res.json()) as { id?: string }
      return { success: true, providerId: json.id }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown email send error',
      }
    }
  }
}

export const emailProvider = new EmailProvider()

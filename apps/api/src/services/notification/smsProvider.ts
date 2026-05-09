import type { NotificationProvider, NotificationPayload, ProviderResult } from './types.js'

/**
 * Twilio SMS provider.
 *
 * Required env:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_FROM_NUMBER
 */
class SMSProvider implements NotificationProvider {
  readonly channel = 'SMS' as const

  get isConfigured(): boolean {
    return !!(
      process.env['TWILIO_ACCOUNT_SID'] &&
      process.env['TWILIO_AUTH_TOKEN'] &&
      process.env['TWILIO_FROM_NUMBER']
    )
  }

  async send(payload: NotificationPayload): Promise<ProviderResult> {
    const { recipient, message } = payload

    if (!recipient.phone) {
      return { success: false, error: 'Recipient has no phone number' }
    }

    const phone = recipient.phone.startsWith('+')
      ? recipient.phone
      : `+91${recipient.phone.replace(/[^\d]/g, '')}` // default India

    if (!this.isConfigured) {
      console.log(`[SMS:SIM] → ${phone}: ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`)
      return {
        success: true,
        providerId: `sim_sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        simulated: true,
      }
    }

    const sid = process.env['TWILIO_ACCOUNT_SID']!
    const token = process.env['TWILIO_AUTH_TOKEN']!
    const from = process.env['TWILIO_FROM_NUMBER']!

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
    const body = new URLSearchParams({ To: phone, From: from, Body: message })

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })

      if (!res.ok) {
        const errBody = await res.text()
        return { success: false, error: `Twilio ${res.status}: ${errBody.slice(0, 200)}` }
      }

      const json = (await res.json()) as { sid?: string }
      return { success: true, providerId: json.sid }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown SMS send error',
      }
    }
  }
}

export const smsProvider = new SMSProvider()

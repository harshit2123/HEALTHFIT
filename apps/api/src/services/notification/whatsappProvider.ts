import type { NotificationProvider, NotificationPayload, ProviderResult } from './types.js'

/**
 * WhatsApp Business Cloud API provider.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Required env:
 * - WHATSAPP_PHONE_NUMBER_ID
 * - WHATSAPP_ACCESS_TOKEN
 *
 * Without these, runs in simulation mode (logs and returns success without calling API).
 */
class WhatsAppProvider implements NotificationProvider {
  readonly channel = 'WHATSAPP' as const

  get isConfigured(): boolean {
    return !!(process.env['WHATSAPP_PHONE_NUMBER_ID'] && process.env['WHATSAPP_ACCESS_TOKEN'])
  }

  async send(payload: NotificationPayload): Promise<ProviderResult> {
    const { recipient, message } = payload

    if (!recipient.phone) {
      return { success: false, error: 'Recipient has no phone number' }
    }

    // Normalize phone: WhatsApp expects E.164 (e.g. 919876543210, no '+' or spaces)
    const phone = recipient.phone.replace(/[^\d]/g, '')

    if (!this.isConfigured) {
      console.log(`[WhatsApp:SIM] → ${phone}: ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`)
      return {
        success: true,
        providerId: `sim_wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        simulated: true,
      }
    }

    const url = `https://graph.facebook.com/v18.0/${process.env['WHATSAPP_PHONE_NUMBER_ID']}/messages`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env['WHATSAPP_ACCESS_TOKEN']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        return { success: false, error: `WhatsApp API ${res.status}: ${errBody.slice(0, 200)}` }
      }

      const json = (await res.json()) as { messages?: Array<{ id: string }> }
      return {
        success: true,
        providerId: json.messages?.[0]?.id,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown WhatsApp send error',
      }
    }
  }
}

export const whatsappProvider = new WhatsAppProvider()

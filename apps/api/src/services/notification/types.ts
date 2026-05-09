// Channel-agnostic notification provider interface.
// All providers (WhatsApp, SMS, Email) implement this so the orchestrator
// can swap them without caring about provider-specific details.

export interface NotificationRecipient {
  userId: string
  name: string
  phone: string | null
  email: string
}

export interface NotificationPayload {
  recipient: NotificationRecipient
  message: string
  templateName?: string
  templateVars?: Record<string, string>
}

export interface ProviderResult {
  success: boolean
  providerId?: string // e.g. WhatsApp message ID, Twilio SID
  error?: string
  // For dev mode when real keys missing
  simulated?: boolean
}

export interface NotificationProvider {
  readonly channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'IN_APP'
  readonly isConfigured: boolean
  send(payload: NotificationPayload): Promise<ProviderResult>
}

// Built-in templates for common gym notifications.
// Variables in {{ }} get replaced from templateVars at send time.
export const NOTIFICATION_TEMPLATES = {
  EXPIRY_7_DAYS: {
    name: 'Subscription expiring in 7 days',
    message:
      'Hi {{name}}, your {{planName}} membership at {{gymName}} expires in 7 days on {{expiryDate}}. Renew to continue your fitness journey!',
  },
  EXPIRY_3_DAYS: {
    name: 'Subscription expiring in 3 days',
    message:
      '{{name}}, only 3 days left on your {{planName}} membership at {{gymName}}. Renew today to keep your progress going.',
  },
  EXPIRY_1_DAY: {
    name: 'Subscription expiring tomorrow',
    message:
      '⏰ {{name}}, your {{gymName}} membership expires tomorrow. Renew now to avoid interruption.',
  },
  EXPIRED: {
    name: 'Subscription expired',
    message:
      'Hi {{name}}, your {{gymName}} membership has expired. Renew anytime to get back on track.',
  },
  WELCOME: {
    name: 'Welcome to gym',
    message:
      'Welcome to {{gymName}}, {{name}}! Your {{planName}} membership is active. Login: {{loginUrl}}',
  },
  WORKOUT_REMINDER: {
    name: 'Workout reminder',
    message: 'Hey {{name}}, time to crush today\'s workout at {{gymName}}!',
  },
  CUSTOM: {
    name: 'Custom message',
    message: '{{message}}',
  },
} as const

export type TemplateKey = keyof typeof NOTIFICATION_TEMPLATES

export function renderTemplate(template: string, vars: Record<string, string> = {}): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

import { api } from './api'

export interface Member {
  id: string
  email: string
  name: string
  phone: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  memberSub: {
    status: string
    expiresAt: string
    plan: { name: string }
  } | null
  assignedToTrainer: Array<{
    trainer: { id: string; name: string }
  }>
}

export interface MembersList {
  members: Member[]
  total: number
  page: number
  limit: number
}

export interface Trainer {
  id: string
  email: string
  name: string
  phone: string | null
  lastLoginAt: string | null
  createdAt: string
  _count: { trainerAssignments: number }
}

export const adminApi = {
  getOrg: async () => {
    const res = await api.get('/admin/org')
    return res.data.data
  },

  listMembers: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: 'ACTIVE' | 'INACTIVE'
    trainerId?: string
  }): Promise<MembersList> => {
    const res = await api.get('/admin/members', { params })
    return res.data.data
  },

  getMember: async (id: string) => {
    const res = await api.get(`/admin/members/${id}`)
    return res.data.data
  },

  createMember: async (data: {
    email: string
    name: string
    phone?: string
    age?: number
    gender?: string
    heightCm?: number
    currentWeightKg?: number
    fitnessLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  }): Promise<{
    id: string
    email: string
    name: string
    tempPassword: string | null
    autoAssignedToTrainer: boolean
  }> => {
    const res = await api.post('/admin/members', data)
    return res.data.data
  },

  updateMember: async (id: string, data: { name?: string; phone?: string; isActive?: boolean }) => {
    const res = await api.patch(`/admin/members/${id}`, data)
    return res.data.data
  },

  deactivateMember: async (id: string) => {
    await api.delete(`/admin/members/${id}`)
  },

  listTrainers: async (): Promise<Trainer[]> => {
    const res = await api.get('/admin/trainers')
    return res.data.data
  },

  createTrainer: async (data: { email: string; name: string; phone?: string }) => {
    const res = await api.post('/admin/trainers', data)
    return res.data.data
  },

  assignTrainer: async (trainerId: string, memberId: string) => {
    const res = await api.post(`/admin/trainers/${trainerId}/members/${memberId}`)
    return res.data.data
  },

  unassignTrainer: async (trainerId: string, memberId: string) => {
    await api.delete(`/admin/trainers/${trainerId}/members/${memberId}`)
  },

  getMyMembers: async () => {
    const res = await api.get('/admin/my-members')
    return res.data.data
  },

  getConversions: async (since?: string): Promise<ConversionLeaderboardEntry[]> => {
    const res = await api.get('/admin/conversions', { params: since ? { since } : undefined })
    return res.data.data
  },

  // Subscription plans
  listPlans: async (includeArchived = false): Promise<SubscriptionPlan[]> => {
    const res = await api.get('/admin/subscriptions', { params: { includeArchived } })
    return res.data.data
  },

  getPlan: async (id: string): Promise<SubscriptionPlan> => {
    const res = await api.get(`/admin/subscriptions/${id}`)
    return res.data.data
  },

  createPlan: async (data: {
    name: string
    description?: string
    priceInr: number
    durationDays: number
    memberCapacity?: number
    features?: Array<{ key: string; label: string; enabled: boolean }>
  }): Promise<SubscriptionPlan> => {
    const res = await api.post('/admin/subscriptions', data)
    return res.data.data
  },

  updatePlan: async (
    id: string,
    data: Partial<{
      name: string
      description: string
      priceInr: number
      durationDays: number
      memberCapacity: number
      isActive: boolean
    }>
  ): Promise<SubscriptionPlan> => {
    const res = await api.patch(`/admin/subscriptions/${id}`, data)
    return res.data.data
  },

  archivePlan: async (id: string) => {
    await api.delete(`/admin/subscriptions/${id}`)
  },

  // Member subscription assignment
  assignSubscription: async (memberId: string, data: { planId: string; amountPaidInr: number }) => {
    const res = await api.post(`/admin/members/${memberId}/subscription`, data)
    return res.data.data
  },

  cancelMemberSubscription: async (memberId: string) => {
    const res = await api.delete(`/admin/members/${memberId}/subscription`)
    return res.data.data
  },

  listMemberSubscriptions: async (params?: {
    status?: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED'
    expiringWithinDays?: number
  }): Promise<MemberSubscriptionRow[]> => {
    const res = await api.get('/admin/member-subscriptions', { params })
    return res.data.data
  },
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  priceInr: string
  durationDays: number
  features: Array<{ key: string; label: string; enabled: boolean }>
  memberCapacity: number | null
  isActive: boolean
  createdAt: string
  _count?: { subscriptions: number }
}

export interface ConversionLeaderboardEntry {
  creatorId: string
  creatorName: string
  creatorRole: 'ORG_OWNER' | 'TRAINER'
  membersAdded: number
}

// Notifications
export interface NotificationTemplate {
  key: string
  name: string
  message: string
}

export interface NotificationRow {
  id: string
  templateName: string | null
  recipientIds: string[]
  messageText: string
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'IN_APP'
  scheduledFor: string | null
  sentAt: string | null
  status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'FAILED'
  failureReason: string | null
  createdAt: string
}

export interface ProviderStatus {
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'IN_APP'
  configured: boolean
}

interface AdminApiNotifications {
  listTemplates: () => Promise<NotificationTemplate[]>
  listProviders: () => Promise<ProviderStatus[]>
  send: (data: {
    recipientIds: string[]
    channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'IN_APP'
    templateKey?: string
    customMessage?: string
    scheduledFor?: string
  }) => Promise<NotificationRow>
  history: (limit?: number) => Promise<NotificationRow[]>
}

export const notificationApi: AdminApiNotifications = {
  listTemplates: async () => {
    const res = await api.get('/admin/notifications/templates')
    return res.data.data
  },
  listProviders: async () => {
    const res = await api.get('/admin/notifications/providers')
    return res.data.data
  },
  send: async (data) => {
    const res = await api.post('/admin/notifications', data)
    return res.data.data
  },
  history: async (limit = 50) => {
    const res = await api.get('/admin/notifications', { params: { limit } })
    return res.data.data
  },
}

export interface MemberSubscriptionRow {
  id: string
  memberId: string
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED'
  startedAt: string
  expiresAt: string
  amountPaidInr: string
  member: { id: string; name: string; email: string; phone: string | null }
  plan: { id: string; name: string; priceInr: string }
}

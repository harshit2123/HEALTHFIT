// User roles - drives routing + RBAC
export type UserRole =
  | 'MASTER_ADMIN'
  | 'ORG_OWNER'
  | 'TRAINER'
  | 'ORG_MEMBER'
  | 'INDIVIDUAL_USER'

// Account type - determines which portal to show
export type AccountType = 'B2B' | 'B2C'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  accountType: AccountType
  orgId: string | null // null for INDIVIDUAL_USER and MASTER_ADMIN
}

export interface AuthTokenPayload {
  userId: string
  role: UserRole
  accountType: AccountType
  orgId: string | null
}

// Portal routing based on role
export const PORTAL_ROUTES: Record<UserRole, string> = {
  MASTER_ADMIN: '/master',
  ORG_OWNER: '/admin',
  TRAINER: '/admin',
  ORG_MEMBER: '/client',
  INDIVIDUAL_USER: '/client',
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
}

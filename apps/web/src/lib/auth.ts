import { z } from 'zod'
import type { User, UserRole, AccountType } from '@spacefit/shared'

const TOKEN_KEY = 'spacefit_token'
const USER_KEY = 'spacefit_user'
export const REFRESH_TOKEN_KEY = 'spacefit_refresh'

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['MASTER_ADMIN', 'ORG_OWNER', 'TRAINER', 'ORG_MEMBER', 'INDIVIDUAL_USER']),
  accountType: z.enum(['B2B', 'B2C']),
  orgId: z.string().nullable().optional(),
})

export function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    const parsed = userSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      clearSession()
      return null
    }
    return parsed.data as User
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getPortalPath(role: UserRole): string {
  if (role === 'MASTER_ADMIN') return '/master'
  if (role === 'ORG_OWNER' || role === 'TRAINER') return '/admin'
  return '/client'
}

export function isB2B(accountType: AccountType): boolean {
  return accountType === 'B2B'
}

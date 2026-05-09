import type { User, UserRole, AccountType } from '@spacefit/shared'

const TOKEN_KEY = 'spacefit_token'
const USER_KEY = 'spacefit_user'

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
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getPortalPath(role: UserRole): string {
  if (role === 'MASTER_ADMIN') return '/master'
  if (role === 'ORG_OWNER' || role === 'TRAINER') return '/admin'
  return '/client'
}

export function isB2B(accountType: AccountType): boolean {
  return accountType === 'B2B'
}

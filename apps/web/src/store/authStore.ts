import { create } from 'zustand'
import type { User } from '@spacefit/shared'
import { saveSession, getUser, getToken, clearSession, REFRESH_TOKEN_KEY } from '../lib/auth'
import { authApi } from '../lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => Promise<void>
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (token, user) => {
    saveSession(token, user)
    set({ token, user, isAuthenticated: true })
  },

  logout: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (refreshToken) {
      // Best-effort server revocation — clear client state regardless of outcome
      authApi.logout(refreshToken).catch(() => undefined)
    }
    clearSession()
    set({ token: null, user: null, isAuthenticated: false })
  },

  hydrate: () => {
    const token = getToken()
    const user = getUser()
    if (token && user) {
      set({ token, user, isAuthenticated: true })
    }
  },
}))

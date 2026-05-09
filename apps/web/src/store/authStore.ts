import { create } from 'zustand'
import type { User } from '@spacefit/shared'
import { saveSession, getUser, getToken, clearSession } from '../lib/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
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

  logout: () => {
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

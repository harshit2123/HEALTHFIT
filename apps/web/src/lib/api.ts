import axios, { AxiosError } from 'axios'
import { getToken, clearSession, saveSession } from './auth'
import type { User } from '@spacefit/shared'

const API_BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401: try refresh, otherwise logout
let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (token && original) {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          } else {
            reject(error)
          }
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = localStorage.getItem('spacefit_refresh')
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken })
      const newAccessToken = data.data.accessToken
      const newRefreshToken = data.data.refreshToken

      localStorage.setItem('spacefit_token', newAccessToken)
      localStorage.setItem('spacefit_refresh', newRefreshToken)

      refreshQueue.forEach((cb) => cb(newAccessToken))
      refreshQueue = []

      original.headers.Authorization = `Bearer ${newAccessToken}`
      return api(original)
    } catch (refreshError) {
      refreshQueue.forEach((cb) => cb(null))
      refreshQueue = []
      clearSession()
      localStorage.removeItem('spacefit_refresh')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export interface AuthResult {
  user: User
  accessToken: string
  refreshToken: string
}

export const authApi = {
  registerB2B: async (data: {
    email: string
    password: string
    name: string
    phone?: string
    orgName: string
    orgDescription?: string
    orgPhone?: string
    orgAddress?: string
  }): Promise<AuthResult> => {
    const res = await api.post('/auth/register', { ...data, accountType: 'B2B' })
    return res.data.data
  },

  registerB2C: async (data: {
    email: string
    password: string
    name: string
    phone?: string
    age?: number
    heightCm?: number
    currentWeightKg?: number
  }): Promise<AuthResult> => {
    const res = await api.post('/auth/register', { ...data, accountType: 'B2C' })
    return res.data.data
  },

  login: async (email: string, password: string): Promise<AuthResult> => {
    const res = await api.post('/auth/login', { email, password })
    return res.data.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken })
  },
}

export function persistAuth(result: AuthResult) {
  saveSession(result.accessToken, result.user)
  localStorage.setItem('spacefit_refresh', result.refreshToken)
}

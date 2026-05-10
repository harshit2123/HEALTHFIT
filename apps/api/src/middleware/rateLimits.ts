import rateLimit from 'express-rate-limit'

/**
 * Rate limits keep auth + AI endpoints from being abused.
 * In-memory store — fine for single-instance dev. Switch to Redis in Phase 9 for horizontal scale.
 */

const AUTH_WINDOW_MS = 15 * 60 * 1000
const REFRESH_WINDOW_MS = 15 * 60 * 1000

// Auth: 5 attempts per 15 minutes per IP. Login + register only.
export const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: 'Too many attempts. Try again in 15 minutes.',
  },
})

// Refresh: 30 attempts per 15 minutes per IP — allows normal usage, blocks brute force.
export const refreshLimiter = rateLimit({
  windowMs: REFRESH_WINDOW_MS,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: 'Too many refresh attempts. Try again later.',
  },
})

// Logout: basic flood protection
export const logoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many logout attempts.' },
})

// AI: 30 calls per minute per user (handles bulk parses + lookups).
// Token-cost cap; protects Claude bill from runaway loops.
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'unknown',
  message: {
    success: false,
    data: null,
    error: 'AI rate limit exceeded. Wait 1 minute.',
  },
})

// General: 200 req/min per user. Catches runaway clients.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'unknown',
  skip: (req) =>
    // Don't rate-limit static-ish health check
    req.path === '/health' || req.path === '/api/health',
})

import rateLimit from 'express-rate-limit'

/**
 * Rate limits keep auth + AI endpoints from being abused.
 * In-memory store — fine for single-instance dev. Switch to Redis in Phase 9 for horizontal scale.
 */

// Auth: 5 attempts per 15 minutes per IP. Login + register only.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: 'Too many attempts. Try again in 15 minutes.',
  },
  // Skip rate limit for refresh endpoint (legitimate frequent calls)
  skip: (req) => req.path === '/refresh' || req.path === '/logout',
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

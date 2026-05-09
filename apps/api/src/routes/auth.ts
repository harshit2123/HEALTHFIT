import { Router } from 'express'
import { z } from 'zod'
import { registerB2BOwner, registerB2CIndividual, login } from '../services/authService.js'
import { rotateRefreshToken, revokeRefreshToken, signAccessToken } from '../services/tokenService.js'
import { prisma } from '../lib/prisma.js'

export const authRouter = Router()

// Validation schemas — fail fast on bad input
const b2bSchema = z.object({
  accountType: z.literal('B2B'),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  orgName: z.string().min(2),
  orgDescription: z.string().optional(),
  orgPhone: z.string().optional(),
  orgAddress: z.string().optional(),
})

const b2cSchema = z.object({
  accountType: z.literal('B2C'),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  age: z.number().int().min(13).max(120).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  currentWeightKg: z.number().min(20).max(500).optional(),
})

const registerSchema = z.discriminatedUnion('accountType', [b2bSchema, b2cSchema])

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string(),
})

// POST /api/auth/register
authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }

    const result =
      parsed.data.accountType === 'B2B'
        ? await registerB2BOwner(parsed.data)
        : await registerB2CIndividual(parsed.data)

    res.status(201).json({ success: true, data: result, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'Email already registered') {
      res.status(409).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: parsed.error.flatten() })
      return
    }

    const result = await login(parsed.data.email, parsed.data.password)
    res.json({ success: true, data: result, error: null })
  } catch (err) {
    if (err instanceof Error && (err.message === 'Invalid credentials' || err.message === 'Account suspended')) {
      res.status(401).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// POST /api/auth/refresh
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: 'Invalid refresh token' })
      return
    }

    const { userId, newToken } = await rotateRefreshToken(parsed.data.refreshToken)

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, role: true, accountType: true, orgId: true },
    })

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      accountType: user.accountType,
      orgId: user.orgId,
    })

    res.json({
      success: true,
      data: { accessToken, refreshToken: newToken },
      error: null,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid or expired refresh token') {
      res.status(401).json({ success: false, data: null, error: err.message })
      return
    }
    next(err)
  }
})

// POST /api/auth/logout
authRouter.post('/logout', async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body)
    if (parsed.success) {
      await revokeRefreshToken(parsed.data.refreshToken)
    }
    res.json({ success: true, data: null, error: null })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me — Get current user info from token
authRouter.get('/me', async (_req, res) => {
  // This endpoint will be hit AFTER auth middleware in real usage
  // For now, return placeholder. Real implementation in Phase 2.
  res.json({ success: true, data: null, error: 'Use /api/admin or /api/client routes for authenticated requests' })
})

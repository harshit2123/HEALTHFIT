import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthTokenPayload } from '@spacefit/shared'
import { env } from '../lib/env.js'
import { prisma } from '../lib/prisma.js'

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    res.status(401).json({ success: false, data: null, error: 'No token provided' })
    return
  }

  try {
    const raw = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
    if (typeof raw !== 'object' || raw === null || !('userId' in raw) || !('role' in raw)) {
      res.status(401).json({ success: false, data: null, error: 'Invalid token' })
      return
    }
    const payload = raw as AuthTokenPayload

    // Check account is still active (suspension takes effect within token TTL)
    prisma.user.findUnique({ where: { id: payload.userId }, select: { isActive: true } })
      .then((user) => {
        if (!user || !user.isActive) {
          res.status(401).json({ success: false, data: null, error: 'Account suspended' })
          return
        }
        req.user = payload
        next()
      })
      .catch(() => {
        res.status(500).json({ success: false, data: null, error: 'Authentication error' })
      })
  } catch {
    res.status(401).json({ success: false, data: null, error: 'Invalid token' })
  }
}

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthTokenPayload } from '@spacefit/shared'

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    res.status(401).json({ success: false, data: null, error: 'No token provided' })
    return
  }

  try {
    const secret = process.env['JWT_SECRET']
    if (!secret) throw new Error('JWT_SECRET not configured')

    const payload = jwt.verify(token, secret) as AuthTokenPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ success: false, data: null, error: 'Invalid token' })
  }
}

import { Request, Response, NextFunction } from 'express'
import type { UserRole } from '@spacefit/shared'

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role

    if (!role || !roles.includes(role)) {
      res.status(403).json({ success: false, data: null, error: 'Insufficient permissions' })
      return
    }

    next()
  }
}

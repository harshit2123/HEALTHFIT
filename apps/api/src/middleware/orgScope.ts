import { Request, Response, NextFunction } from 'express'

/**
 * Org scoping enforcement.
 *
 * Rules:
 * - MASTER_ADMIN: bypass (sees all orgs)
 * - ORG_OWNER, TRAINER, ORG_MEMBER: must have orgId in token; queries auto-scoped
 * - INDIVIDUAL_USER: orgId is null (B2C); never accesses org-scoped resources
 *
 * Use this middleware on any route that touches org-scoped data (members,
 * subscriptions, notifications, etc.) AFTER authenticate + requireRole.
 */
export function requireOrgScope(req: Request, res: Response, next: NextFunction) {
  const user = req.user
  if (!user) {
    res.status(401).json({ success: false, data: null, error: 'Not authenticated' })
    return
  }

  // Master Admin bypass — they read across all orgs
  if (user.role === 'MASTER_ADMIN') {
    next()
    return
  }

  // Everyone else needs an orgId
  if (!user.orgId) {
    res.status(403).json({ success: false, data: null, error: 'No organization context' })
    return
  }

  next()
}

/**
 * Helper to get the org filter for Prisma queries.
 * Returns {} for MASTER_ADMIN (no filter), { orgId } for everyone else.
 */
export function getOrgFilter(user: { role: string; orgId: string | null }): { orgId?: string } {
  if (user.role === 'MASTER_ADMIN') return {}
  if (!user.orgId) throw new Error('Missing org context')
  return { orgId: user.orgId }
}

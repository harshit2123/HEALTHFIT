import jwt, { SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'
import { env } from '../lib/env.js'
import { prisma } from '../lib/prisma.js'
import type { AuthTokenPayload } from '@spacefit/shared'

// Access token (short-lived, sent on every request)
export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions)
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload
}

// Refresh token (long-lived, stored in DB so we can revoke it)
export async function issueRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(48).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  })

  return token
}

export async function rotateRefreshToken(oldToken: string): Promise<{ userId: string; newToken: string }> {
  return prisma.$transaction(async (tx) => {
    const stored = await tx.refreshToken.findUnique({ where: { token: oldToken } })

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token')
    }

    // Atomic revoke — if concurrent request already revoked this token, update returns nothing
    const revoked = await tx.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    if (revoked.count === 0) {
      throw new Error('Invalid or expired refresh token')
    }

    const newTokenValue = crypto.randomBytes(48).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await tx.refreshToken.create({ data: { userId: stored.userId, token: newTokenValue, expiresAt } })

    return { userId: stored.userId, newToken: newTokenValue }
  })
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

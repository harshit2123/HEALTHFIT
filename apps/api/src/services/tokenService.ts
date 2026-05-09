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
  const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } })

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token')
  }

  // Revoke old token (single-use refresh tokens)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  })

  const newToken = await issueRefreshToken(stored.userId)
  return { userId: stored.userId, newToken }
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

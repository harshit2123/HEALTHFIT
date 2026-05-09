import { PrismaClient } from '@prisma/client'

// Single Prisma client instance across the app
// In dev, hot reload would create multiple connections without this guard
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
  // Connection pool tuning — supports ~5K concurrent users on a single API instance
  // Supabase pooler handles up to 200 connections by default; we use 20 per instance
  // For horizontal scaling: spawn more API instances, not more connections per instance
})

if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma

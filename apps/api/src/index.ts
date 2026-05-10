import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'
import { clientRouter } from './routes/client.js'
import { masterRouter } from './routes/master.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authenticate } from './middleware/authenticate.js'
import { requireRole } from './middleware/requireRole.js'
import { authLimiter, apiLimiter } from './middleware/rateLimits.js'
import { startExpiryJob } from './services/expiryJob.js'
import { prisma } from './lib/prisma.js'

const app = express()
const PORT = Number(process.env['PORT'] ?? 4000)
const isProduction = process.env['NODE_ENV'] === 'production'

// Security headers — helmet defaults are sane
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://api.anthropic.com', 'https://generativelanguage.googleapis.com', 'https://api.groq.com', 'https://api.resend.com', 'https://graph.facebook.com', 'https://api.twilio.com'],
          },
        }
      : false,
  })
)

// CORS allowlist — comma-separated origins via env, fallback to single CLIENT_URL
const corsOrigins = (process.env['CORS_ORIGINS'] ?? process.env['CLIENT_URL'] ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  })
)

app.use(express.json({ limit: '1mb' }))

// Health check — no auth, no rate limit (for load balancer probes)
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true, timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ ok: false, db: 'unreachable' })
  }
})

// Public routes — auth-specific rate limit
app.use('/api/auth', authLimiter, authRouter)

// Protected routes — auth, role gate, then per-user rate limit
app.use(
  '/api/master',
  authenticate,
  requireRole(['MASTER_ADMIN']),
  apiLimiter,
  masterRouter
)
app.use(
  '/api/admin',
  authenticate,
  requireRole(['ORG_OWNER', 'TRAINER']),
  apiLimiter,
  adminRouter
)
app.use(
  '/api/client',
  authenticate,
  requireRole(['ORG_MEMBER', 'INDIVIDUAL_USER']),
  apiLimiter,
  clientRouter
)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`[spacefit] API running on port ${PORT} (env: ${process.env['NODE_ENV'] ?? 'development'})`)
  console.log(`[spacefit] CORS allowed: ${corsOrigins.join(', ')}`)
  startExpiryJob()
})

// Graceful shutdown — finish in-flight requests before exit
const shutdown = async (sig: string) => {
  console.log(`[spacefit] ${sig} received. Shutting down…`)
  await prisma.$disconnect()
  process.exit(0)
}
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

export default app

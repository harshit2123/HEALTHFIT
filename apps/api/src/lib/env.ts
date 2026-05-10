import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

// Fail fast at startup if env is misconfigured
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  PORT: z.string().transform(Number).default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default('12'),
  B2C_TRIAL_DAYS: z.string().transform(Number).default('30'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const env = parsed.data

// Production: refuse to start with default/dev secrets
if (env.NODE_ENV === 'production') {
  const weakSecrets = [
    'dev-secret',
    'change-this',
    'your-secret',
    'secret',
    'changeme',
  ]
  for (const secret of weakSecrets) {
    if (env.JWT_SECRET.toLowerCase().includes(secret)) {
      throw new Error('JWT_SECRET looks like a dev/example value. Set a strong random secret in production.')
    }
    if (env.JWT_REFRESH_SECRET.toLowerCase().includes(secret)) {
      throw new Error('JWT_REFRESH_SECRET looks like a dev/example value. Set a strong random secret in production.')
    }
  }
  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different')
  }
  if (env.BCRYPT_SALT_ROUNDS < 10) {
    throw new Error('BCRYPT_SALT_ROUNDS must be ≥10 in production')
  }
}

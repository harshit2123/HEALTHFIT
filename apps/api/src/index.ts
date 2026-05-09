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
import { startExpiryJob } from './services/expiryJob.js'

const app = express()
const PORT = process.env['PORT'] ?? 4000

app.use(helmet())
app.use(cors({ origin: process.env['CLIENT_URL'] ?? 'http://localhost:5173' }))
app.use(express.json())

// Public routes (no auth)
app.use('/api/auth', authRouter)

// Protected routes (auth required, role-gated)
app.use('/api/master', authenticate, requireRole(['MASTER_ADMIN']), masterRouter)
app.use('/api/admin', authenticate, requireRole(['ORG_OWNER', 'TRAINER']), adminRouter)
app.use('/api/client', authenticate, requireRole(['ORG_MEMBER', 'INDIVIDUAL_USER']), clientRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Spacefit API running on port ${PORT}`)
  startExpiryJob()
})

export default app

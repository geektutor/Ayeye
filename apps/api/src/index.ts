import cors from 'cors'
import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'

import { AppError } from './lib/errors'
import authRouter from './routes/auth.route'
import eventsRouter from './routes/events.route'
import registrationsRouter from './routes/registrations.route'
import webhooksRouter from './routes/webhooks.route'

const app: Express = express()

app.use(helmet())
app.use(cors({ origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173' }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/auth', authRouter)
app.use('/api/events', eventsRouter)
app.use('/api', registrationsRouter) // handles /api/events/:id/register and /api/checkin
app.use('/api/webhooks', webhooksRouter)

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', statusCode: 404 })
})

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message, statusCode: err.statusCode })
    return
  }
  console.error(err)
  res.status(500).json({ success: false, error: 'Internal server error', statusCode: 500 })
})

export { app }
export default app

import { type NextFunction, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  userId: string
  email: string
  role: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided', statusCode: 401 })
    return
  }

  const token = authHeader.substring(7)
  try {
    const secret = process.env['JWT_SECRET'] ?? 'dev-secret'
    const payload = jwt.verify(token, secret) as AuthUser
    req.user = payload
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token', statusCode: 401 })
  }
}

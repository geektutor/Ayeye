import { type NextFunction, type Request, type Response } from 'express'
import { type ZodSchema } from 'zod'

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'root',
        message: issue.message,
      }))
      res.status(400).json({ success: false, errors })
      return
    }
    req.body = result.data
    next()
  }

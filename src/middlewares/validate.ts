import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        message: 'فشل التحقق من البيانات',
        errors: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }
    req.body = result.data // البيانات المتحققة
    next()
  }

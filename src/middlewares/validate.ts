import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    console.log('Validating request body:', req.body)
    const result = schema.safeParse(req.body)
    if (!result.success) {
      console.error('Validation errors:', result.error.errors)
      return res.status(400).json({
        message: 'فشل التحقق من البيانات',
        error: result.error.errors.map((e) => e.message).join(', '),
        errors: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }
    req.body = result.data // البيانات المتحققة
    next()
  }

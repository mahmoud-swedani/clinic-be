// controllers/payment.controller.ts

import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/apiResponse'
import { PaymentService } from '../services/payment.service'

export const createPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id // المحاسب الذي سجّل الدفعة
    const result = await PaymentService.createPayment(req.body, userId)
    return sendSuccess(
      res,
      result,
      'تم تسجيل الدفعة وتحديث الفاتورة',
      201
    )
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      error.message || 'فشل في تسجيل الدفعة',
      error.message?.includes('غير موجودة') ? 404 : 500,
      error?.message || String(error)
    )
  }
}

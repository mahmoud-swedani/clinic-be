// controllers/payment.controller.ts

import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/apiResponse'
import { PaymentService } from '../services/payment.service'
import { Payment } from '../models/payment.model'
import mongoose from 'mongoose'

export const createPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id // المحاسب الذي سجّل الدفعة
    if (!userId) {
      return sendError(res, 'المستخدم غير معروف', 401)
    }
    const result = await PaymentService.createPayment(req.body, userId, req)
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

// 📄 جلب الدفعات الخاصة بفاتورة معينة
export const getPaymentsByInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return sendError(res, 'معرف الفاتورة غير صحيح', 400)
    }

    const payments = await Payment.find({ invoice: invoiceId })
      .populate('client', 'fullName')
      .populate('appointment', 'date')
      .populate('receivedBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .lean()

    return sendSuccess(res, payments)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الدفعات',
      500,
      error?.message || String(error)
    )
  }
}

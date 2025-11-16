// controllers/payment.controller.ts

import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/apiResponse'
import { PaymentService } from '../services/payment.service'
import { Payment } from '../models/payment.model'
import mongoose from 'mongoose'
import { validate } from '../middlewares/validate'
import { updatePaymentSchema } from '../validations/payment.validation'

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
      .populate('treatmentStages', 'title cost')
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

// 🗑️ حذف دفعة وإعادة حساب مبالغ الفاتورة
export const deletePayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id
    if (!userId) {
      return sendError(res, 'المستخدم غير معروف', 401)
    }

    const { paymentId } = req.params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return sendError(res, 'معرف الدفعة غير صحيح', 400)
    }

    const result = await PaymentService.deletePayment(paymentId, userId, req)
    return sendSuccess(res, result, 'تم حذف الدفعة وإعادة حساب الفاتورة بنجاح')
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      error.message || 'فشل في حذف الدفعة',
      error.message?.includes('غير موجودة') ? 404 : 500,
      error?.message || String(error)
    )
  }
}

// 🔄 إعادة حساب مبالغ الفاتورة من جميع الدفعات
export const recalculateInvoiceAmounts = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return sendError(res, 'معرف الفاتورة غير صحيح', 400)
    }

    const invoice = await PaymentService.recalculateInvoiceAmounts(invoiceId)
    return sendSuccess(res, invoice, 'تم إعادة حساب مبالغ الفاتورة بنجاح')
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      error.message || 'فشل في إعادة حساب مبالغ الفاتورة',
      error.message?.includes('غير موجودة') ? 404 : 500,
      error?.message || String(error)
    )
  }
}

// ✏️ تحديث دفعة وإعادة حساب الفاتورة
export const updatePayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id
    if (!userId) {
      return sendError(res, 'المستخدم غير معروف', 401)
    }

    const { paymentId } = req.params

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return sendError(res, 'معرف الدفعة غير صحيح', 400)
    }

    // Log request body for debugging
    console.log('Update payment request:', {
      paymentId,
      body: req.body,
      userId,
    })

    const result = await PaymentService.updatePayment(paymentId, req.body, userId, req)
    return sendSuccess(res, result, 'تم تحديث الدفعة وإعادة حساب الفاتورة بنجاح')
  } catch (error: any) {
    console.error('Error updating payment:', error)
    console.error('Error stack:', error.stack)
    return sendError(
      res,
      error.message || 'فشل في تحديث الدفعة',
      error.message?.includes('غير موجودة') ? 404 : 500,
      error?.message || String(error)
    )
  }
}

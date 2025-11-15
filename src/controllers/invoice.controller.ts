// controllers/invoice.controller.ts

import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { InvoiceService } from '../services/invoice.service'
import mongoose from 'mongoose'

// 📄 جلب الفواتير الغير مكتملة (غير مدفوعة أو مدفوعة جزئيًا)
export const getUnpaidInvoices = async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req)
    const userId = req.user?._id?.toString()
    const { invoices, total } = await InvoiceService.getUnpaidInvoices(
      page,
      limit,
      req.user, // Pass full user object
      userId
    )
    return sendPaginated(res, invoices, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الفواتير',
      500,
      error?.message || String(error)
    )
  }
}

// 📄 جلب كل الفواتير
export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req)
    const userId = req.user?._id?.toString()
    const { invoices, total } = await InvoiceService.getAllInvoices(
      page,
      limit,
      req.user, // Pass full user object
      userId
    )
    return sendPaginated(res, invoices, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الفواتير',
      500,
      error?.message || String(error)
    )
  }
}

// 📄 جلب فاتورة واحدة بالمعرف
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?._id?.toString()

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'معرف الفاتورة غير صحيح', 400)
    }

    const invoice = await InvoiceService.getInvoiceById(id, req.user, userId)

    if (!invoice) {
      return sendError(res, 'الفاتورة غير موجودة', 404)
    }

    return sendSuccess(res, invoice)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الفاتورة',
      500,
      error?.message || String(error)
    )
  }
}

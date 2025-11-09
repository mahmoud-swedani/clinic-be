import { Request, Response } from 'express'
import { FinancialRecord } from '../models/financialRecord.model'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'

// إنشاء سجل مالي جديد (شراء أو مصروف أو راتب)
export const createFinancialRecord = async (req: Request, res: Response) => {
  try {
    const recordData = req.body
    const newRecord = new FinancialRecord(recordData)
    await newRecord.save()
    return sendSuccess(res, newRecord, 'تم إنشاء السجل المالي بنجاح', 201)
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      'فشل في إنشاء السجل المالي',
      500,
      error?.message || String(error)
    )
  }
}

// جلب كل السجلات المالية أو فلتر حسب نوع السجل (purchase | expense | salary)
export const getAllFinancialRecords = async (req: Request, res: Response) => {
  try {
    const { recordType } = req.query
    const { page, limit, skip } = parsePagination(req)

    // بناء شرط الفلترة إن وجد
    const filter: any = {}
    if (
      recordType &&
      ['purchase', 'expense', 'salary'].includes(recordType as string)
    ) {
      filter.recordType = recordType
    }

    const [records, total] = await Promise.all([
      FinancialRecord.find(filter)
        .sort({ recordDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FinancialRecord.countDocuments(filter),
    ])

    return sendPaginated(res, records, { page, limit, total })
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      'فشل في جلب السجلات المالية',
      500,
      error?.message || String(error)
    )
  }
}

// جلب سجل مالي واحد حسب الـ ID
export const getFinancialRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const record = await FinancialRecord.findById(id).lean()
    if (!record) {
      return sendError(res, 'السجل المالي غير موجود', 404)
    }
    return sendSuccess(res, record)
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      'فشل في جلب السجل المالي',
      500,
      error?.message || String(error)
    )
  }
}

// إضافة دفعة دفع جديدة لسجل مالي موجود
export const addPaymentToRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const payment = req.body // { amount, paymentDate, method, notes? }

    const record = await FinancialRecord.findById(id)
    if (!record) {
      return sendError(res, 'السجل المالي غير موجود', 404)
    }

    record.payments.push(payment)

    // تحديث حالة الدفع بناءً على مجموع الدفعات
    const totalPaid = record.payments.reduce((sum, p) => sum + p.amount, 0)
    if (totalPaid >= record.totalAmount) {
      record.status = 'paid'
    } else if (totalPaid > 0) {
      record.status = 'partial'
    } else {
      record.status = 'unpaid'
    }

    await record.save()
    return sendSuccess(res, record, 'تم إضافة الدفعة بنجاح')
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      'فشل في إضافة الدفعة',
      500,
      error?.message || String(error)
    )
  }
}

// حذف سجل مالي
export const deleteFinancialRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const record = await FinancialRecord.findByIdAndDelete(id)
    if (!record) {
      return sendError(res, 'السجل المالي غير موجود', 404)
    }
    return sendSuccess(res, null, 'تم حذف السجل المالي بنجاح')
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      'فشل في حذف السجل المالي',
      500,
      error?.message || String(error)
    )
  }
}

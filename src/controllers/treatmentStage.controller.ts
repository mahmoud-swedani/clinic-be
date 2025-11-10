// controllers/treatmentStage.controller.ts

import { Request, Response } from 'express'
import { TreatmentStage } from '../models/treatmentStage.model'
import { Invoice } from '../models/invoice.model'
import { SalePayment } from '../models/salePayment.model'
import { Sale } from '../models/sale.model'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
// ➕ إضافة مرحلة علاج
export const createTreatmentStage = async (req: Request, res: Response) => {
  try {
    const stage = await TreatmentStage.create(req.body)

    const { patient, appointment, cost } = stage
    const userId = req.user?._id?.toString() || req.user?.id // MongoDB uses _id
    // المستخدم الذي أضاف المرحلة (طبيب)

    if (!cost || !appointment) {
      // لا تُنشئ فاتورة إذا لم يكن هناك تكلفة أو موعد
      return sendSuccess(res, stage, 'تم إنشاء المرحلة بنجاح', 201)
    }

    // تحقق هل توجد فاتورة حالية لنفس المريض والموعد
    let invoice = await Invoice.findOne({ patient, appointment })

    if (invoice) {
      // أضف المرحلة إلى الفاتورة الحالية
      invoice.treatmentStages.push(stage._id as any)
      invoice.totalAmount += cost
      invoice.remainingAmount += cost
    } else {
      // أنشئ فاتورة جديدة
      invoice = await Invoice.create({
        patient,
        appointment,
        treatmentStages: [stage._id as any],
        totalAmount: cost,
        paidAmount: 0,
        remainingAmount: cost,
        status: 'غير مدفوعة',
        createdBy: userId,
      })
    }

    await invoice.save()

    return sendSuccess(
      res,
      { stage, invoice },
      'تم إنشاء المرحلة والفاتورة بنجاح',
      201
    )
  } catch (error: any) {
    return sendError(
      res,
      'فشل في إنشاء المرحلة أو الفاتورة',
      500,
      error?.message || String(error)
    )
  }
}
// 📄 الحصول على كل المراحل لمريض
export const getTreatmentStagesByPatient = async (
  req: Request,
  res: Response
) => {
  try {
    const patientId = req.params.patientId

    // 1. جلب مراحل العلاج للمريض مع بيانات الطبيب، الموعد، والمريض
    const stages = await TreatmentStage.find({ patient: patientId })
      .populate('doctor', 'name')
      .populate('appointment')
      .populate('patient', 'name')
      .lean()

    // 2. جلب المبيعات المرتبطة بالمريض
    const sales = await Sale.find({ patient: patientId })
      .populate('items.product', 'name price')
      .lean()

    // 3. جلب دفعات الدفع المرتبطة بكل عملية بيع للمريض
    // - ناخد جميع الـ saleIds الموجودة في sales
    const saleIds = sales.map((sale) => sale._id)

    const payments = await SalePayment.find({ sale: { $in: saleIds } })
      .sort({ createdAt: 1 })
      .lean()

    // 4. رتب الدفعات حسب كل عملية بيع لتسهيل العرض لاحقًا
    const paymentsBySaleId = payments.reduce((acc, payment) => {
      const saleIdStr = payment.sale.toString()
      if (!acc[saleIdStr]) acc[saleIdStr] = []
      acc[saleIdStr].push(payment)
      return acc
    }, {} as Record<string, typeof payments>)

    // 5. رجع البيانات بشكل مرتب، مثلاً تضيف الدفعات لكل عملية بيع
    const salesWithPayments = sales.map((sale: any) => ({
      ...sale,
      payments: paymentsBySaleId[(sale._id as any).toString()] || [],
    }))

    return sendSuccess(res, { stages, sales: salesWithPayments })
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      'فشل في جلب البيانات',
      500,
      error?.message || String(error)
    )
  }
}

// ✏️ تعديل مرحلة
export const updateTreatmentStage = async (req: Request, res: Response) => {
  try {
    const stage = await TreatmentStage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).lean()
    if (!stage) {
      return sendError(res, 'لم يتم العثور على المرحلة', 404)
    }
    return sendSuccess(res, stage, 'تم تحديث المرحلة بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في التعديل',
      500,
      error?.message || String(error)
    )
  }
}

// 🗑 حذف مرحلة
export const deleteTreatmentStage = async (req: Request, res: Response) => {
  try {
    const deleted = await TreatmentStage.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return sendError(res, 'لم يتم العثور على المرحلة', 404)
    }
    return sendSuccess(res, null, 'تم الحذف بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في الحذف',
      500,
      error?.message || String(error)
    )
  }
}

// 📄 الحصول على مراحل علاجية لموعد معين
export const getTreatmentStagesByAppointment = async (
  req: Request,
  res: Response
) => {
  try {
    const appointmentId = req.params.appointmentId

    const stages = await TreatmentStage.find({ appointment: appointmentId })
      .populate('doctor', 'name')
      .populate('appointment')
      .populate('patient', 'fullName')
      .sort({ createdAt: -1 })
      .lean()

    return sendSuccess(res, stages)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب المراحل العلاجية',
      500,
      error?.message || String(error)
    )
  }
}

// 📄 الحصول على كل المراحل
export const getAllTreatmentStages = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = parsePagination(req)

    const [stages, total] = await Promise.all([
      TreatmentStage.find()
        .populate('doctor', 'name')
        .populate('appointment')
        .populate('patient', 'name') // ⬅️ هذا يضيف اسم المريض فقط
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TreatmentStage.countDocuments(),
    ])

    return sendPaginated(res, stages, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب المراحل',
      500,
      error?.message || String(error)
    )
  }
}

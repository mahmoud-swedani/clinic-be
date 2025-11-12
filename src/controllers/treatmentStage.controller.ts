// controllers/treatmentStage.controller.ts

import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { TreatmentStage } from '../models/treatmentStage.model'
import { Invoice } from '../models/invoice.model'
import { SalePayment } from '../models/salePayment.model'
import { Sale } from '../models/sale.model'
import { Appointment } from '../models/appointment.model'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { getUserRoleName } from '../services/roleLookup.service'
import { AuditService } from '../services/audit.service'
// ➕ إضافة مرحلة علاج
export const createTreatmentStage = async (req: Request, res: Response) => {
  try {
    const stage = await TreatmentStage.create(req.body)

    const { patient, appointment, cost } = stage
    const userId = req.user?._id?.toString() || req.user?.id // MongoDB uses _id
    // المستخدم الذي أضاف المرحلة (طبيب)

    if (!cost || !appointment) {
      // لا تُنشئ فاتورة إذا لم يكن هناك تكلفة أو موعد
      // Log audit event for treatment stage creation
      if (userId) {
        await AuditService.logCreate(
          'TreatmentStage',
          stage._id as mongoose.Types.ObjectId,
          userId as unknown as mongoose.Types.ObjectId,
          req
        )
      }
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

    // Log audit event for treatment stage creation
    if (userId) {
      await AuditService.logCreate(
        'TreatmentStage',
        stage._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        req
      )
    }

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
    const userId = req.user?._id?.toString()
    const user = req.user

    // Build filter for treatment stages
    const stageFilter: any = { patient: patientId }
    const userRoleName = user ? getUserRoleName(user) : null

    // If user is a doctor, only show treatment stages where doctor = userId
    if (userRoleName === 'طبيب' && userId) {
      stageFilter.doctor = userId

      // Verify doctor has at least one appointment with this patient
      const hasAppointment = await Appointment.findOne({
        patient: patientId,
        doctor: userId,
      }).lean()

      if (!hasAppointment) {
        // Doctor doesn't have any appointments with this patient
        return sendError(res, 'لا يمكن الوصول إلى بيانات هذا المريض', 403)
      }
    }

    // 1. جلب مراحل العلاج للمريض مع بيانات الطبيب، الموعد، والمريض
    const stages = await TreatmentStage.find(stageFilter)
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

// 📄 الحصول على مرحلة علاجية واحدة
export const getTreatmentStageById = async (req: Request, res: Response) => {
  try {
    const stageId = req.params.id
    const userId = req.user?._id?.toString()
    const user = req.user

    // Build filter
    const filter: any = { _id: stageId }
    const userRoleName = user ? getUserRoleName(user) : null

    // If user is a doctor, only allow access to their own stages
    if (userRoleName === 'طبيب' && userId) {
      filter.doctor = userId
    }

    const stage = await TreatmentStage.findOne(filter)
      .populate('doctor', 'name email')
      .populate('appointment')
      .populate('patient', 'fullName phone')
      .lean()

    if (!stage) {
      return sendError(res, 'لم يتم العثور على المرحلة', 404)
    }

    return sendSuccess(res, stage)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب المرحلة',
      500,
      error?.message || String(error)
    )
  }
}

// ✏️ تعديل مرحلة
export const updateTreatmentStage = async (req: Request, res: Response) => {
  try {
    const stageId = req.params.id
    const userId = req.user?._id?.toString()
    const user = req.user

    // Build filter to find the stage
    const filter: any = { _id: stageId }
    const userRoleName = user ? getUserRoleName(user) : null

    // If user is a doctor, only allow editing their own stages
    if (userRoleName === 'طبيب' && userId) {
      filter.doctor = userId
    }

    // First check if stage exists and user has access
    const existingStage = await TreatmentStage.findOne(filter).lean()
    if (!existingStage) {
      return sendError(res, 'لم يتم العثور على المرحلة أو ليس لديك صلاحية لتعديلها', 404)
    }

    // Update the stage
    const stage = await TreatmentStage.findByIdAndUpdate(
      stageId,
      req.body,
      { new: true }
    )
      .populate('doctor', 'name')
      .populate('appointment')
      .populate('patient', 'fullName')
      .lean()

    if (!stage) {
      return sendError(res, 'فشل في تحديث المرحلة', 500)
    }

    // Log audit event for treatment stage update
    if (userId) {
      await AuditService.logUpdate(
        'TreatmentStage',
        stageId as unknown as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        { before: existingStage, after: stage },
        req
      )
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
    const stageId = req.params.id
    const userId = req.user?._id?.toString()
    const user = req.user

    // Build filter to find the stage
    const filter: any = { _id: stageId }
    const userRoleName = user ? getUserRoleName(user) : null

    // If user is a doctor, only allow deleting their own stages
    if (userRoleName === 'طبيب' && userId) {
      filter.doctor = userId
    }

    // First check if stage exists and user has access
    const existingStage = await TreatmentStage.findOne(filter).lean()
    if (!existingStage) {
      return sendError(res, 'لم يتم العثور على المرحلة أو ليس لديك صلاحية لحذفها', 404)
    }

    // Log audit event for treatment stage deletion (before deletion)
    if (userId) {
      await AuditService.logDelete(
        'TreatmentStage',
        stageId as unknown as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        existingStage,
        req
      )
    }

    const deleted = await TreatmentStage.findByIdAndDelete(stageId)
    if (!deleted) {
      return sendError(res, 'فشل في حذف المرحلة', 500)
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
    const userId = req.user?._id?.toString()
    const user = req.user

    // Build filter for treatment stages
    const stageFilter: any = { appointment: appointmentId }
    const userRoleName = user ? getUserRoleName(user) : null

    // If user is a doctor, verify the appointment belongs to them
    if (userRoleName === 'طبيب' && userId) {
      // First verify the appointment belongs to this doctor
      const appointment = await Appointment.findById(appointmentId).lean()
      
      if (!appointment) {
        return sendError(res, 'الموعد غير موجود', 404)
      }

      if (appointment.doctor.toString() !== userId) {
        // Doctor doesn't own this appointment
        return sendError(res, 'لا يمكن الوصول إلى بيانات هذا الموعد', 403)
      }

      // Filter stages to only those where doctor = userId
      stageFilter.doctor = userId
    }

    const stages = await TreatmentStage.find(stageFilter)
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
    const userId = req.user?._id?.toString()
    const user = req.user

    // Build filter based on role
    const filter: any = {}
    const userRoleName = user ? getUserRoleName(user) : null
    if (userRoleName === 'طبيب' && userId) {
      // Doctors can only see their own treatment stages
      filter.doctor = userId
    }

    const [stages, total] = await Promise.all([
      TreatmentStage.find(filter)
        .populate('doctor', 'name')
        .populate('appointment')
        .populate('patient', 'name') // ⬅️ هذا يضيف اسم المريض فقط
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TreatmentStage.countDocuments(filter),
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

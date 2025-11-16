import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/apiResponse'
import { AppointmentService } from '../services/appointment.service'
import { AuditService } from '../services/audit.service'
import mongoose from 'mongoose'

// Add service to appointment
export const addServiceToAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params
    const { serviceId } = req.body

    if (!serviceId) {
      return sendError(res, 'معرف الخدمة مطلوب', 400)
    }

    const appointmentService = await AppointmentService.addServiceToAppointment(
      appointmentId,
      serviceId
    )

    const userId = req.user?._id?.toString()
    
    // Log activity
    if (userId && appointmentService._id) {
      await AuditService.logCreate(
        'AppointmentService',
        appointmentService._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        req
      )
    }

    return sendSuccess(res, appointmentService, 'تم إضافة الخدمة إلى الموعد بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      error.message || 'فشل في إضافة الخدمة إلى الموعد',
      error.message.includes('غير موجود') || error.message.includes('موجودة') ? 400 : 500,
      error?.message || String(error)
    )
  }
}

// Remove service from appointment
export const removeServiceFromAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId, serviceId } = req.params

    const appointmentService = await AppointmentService.removeServiceFromAppointment(
      appointmentId,
      serviceId
    )

    const userId = req.user?._id?.toString()
    
    // Log activity
    if (userId && appointmentService._id) {
      await AuditService.logDelete(
        'AppointmentService',
        appointmentService._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        appointmentService,
        req
      )
    }

    return sendSuccess(res, null, 'تم حذف الخدمة من الموعد بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      error.message || 'فشل في حذف الخدمة من الموعد',
      error.message.includes('غير موجود') || error.message.includes('آخر خدمة') ? 400 : 500,
      error?.message || String(error)
    )
  }
}

// Get all services for an appointment
export const getAppointmentServices = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params

    const appointmentServices = await AppointmentService.getAppointmentServices(appointmentId)

    return sendSuccess(res, appointmentServices)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب خدمات الموعد',
      500,
      error?.message || String(error)
    )
  }
}

// Reorder services (optional feature)
export const reorderServices = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params
    const { serviceOrders } = req.body // Array of { serviceId, order }

    if (!Array.isArray(serviceOrders)) {
      return sendError(res, 'يجب إرسال مصفوفة من ترتيب الخدمات', 400)
    }

    // Update order for each service
    const updatePromises = serviceOrders.map(({ serviceId, order }: { serviceId: string; order: number }) =>
      mongoose.model('AppointmentService').updateOne(
        { appointment: appointmentId, service: serviceId },
        { $set: { order } }
      )
    )

    await Promise.all(updatePromises)

    // Get updated services
    const appointmentServices = await AppointmentService.getAppointmentServices(appointmentId)

    return sendSuccess(res, appointmentServices, 'تم تحديث ترتيب الخدمات بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تحديث ترتيب الخدمات',
      500,
      error?.message || String(error)
    )
  }
}


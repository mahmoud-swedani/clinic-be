import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { AppointmentService } from '../services/appointment.service'
import { AuditService } from '../services/audit.service'
import mongoose from 'mongoose'

// إنشاء موعد جديد
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const appointment = await AppointmentService.createAppointment(req.body)
    const userId = req.user?._id?.toString()
    
    // Log activity
    if (userId && appointment._id) {
      await AuditService.logCreate(
        'Appointment',
        appointment._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        req
      )
    }
    
    return sendSuccess(res, appointment, 'تم إنشاء الموعد بنجاح', 201)
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      error.message || 'فشل في إنشاء الموعد',
      error.message.includes('مطلوبة') || error.message.includes('غير موجود') ? 400 : 500,
      error?.message || String(error)
    )
  }
}

// باقي دوال الجلب والتعديل والحذف كما في كودك السابق
export const getAppointmentsByPatient = async (req: Request, res: Response) => {
  try {
    const appointments = await AppointmentService.getAppointmentsByPatient(
      req.params.patientId
    )
    return sendSuccess(res, appointments)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب المواعيد',
      500,
      error?.message || String(error)
    )
  }
}

export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req)
    const userId = req.user?._id?.toString()

    const { appointments, total } = await AppointmentService.getAllAppointments(
      page,
      limit,
      req.user, // Pass full user object for role lookup
      userId
    )
    return sendPaginated(res, appointments, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب المواعيد',
      500,
      error?.message || String(error)
    )
  }
}

export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id?.toString()

    const appointment = await AppointmentService.getAppointmentById(
      req.params.id,
      req.user, // Pass full user object for role lookup
      userId
    )
    if (!appointment) {
      return sendError(res, 'لم يتم العثور على الموعد', 404)
    }
    return sendSuccess(res, appointment)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب تفاصيل الموعد',
      500,
      error?.message || String(error)
    )
  }
}

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const result = await AppointmentService.updateAppointment(
      req.params.id,
      req.body
    )
    if (!result || !result.updated) {
      return sendError(res, 'لم يتم العثور على الموعد', 404)
    }
    
    const { updated, oldAppointment } = result
    const userId = req.user?._id?.toString()
    
    // Log activity with changes
    if (userId && updated._id) {
      // Calculate what changed
      const changes: any = {
        before: {},
        after: {},
      }
      
      // Compare fields
      const fieldsToCheck = ['patient', 'doctor', 'date', 'type', 'status', 'notes', 'service', 'departmentId']
      fieldsToCheck.forEach((field) => {
        const oldValue = oldAppointment?.[field as keyof typeof oldAppointment]
        const newValue = updated[field as keyof typeof updated]
        
        // Special handling for date field
        if (field === 'date') {
          const oldDate = oldValue ? new Date(oldValue as any).toISOString() : null
          const newDate = newValue ? new Date(newValue as any).toISOString() : null
          if (oldDate !== newDate) {
            changes.before[field] = oldValue
            changes.after[field] = newValue
          }
          return
        }
        
        // Compare IDs if they're objects
        const oldId = typeof oldValue === 'object' && oldValue !== null && '_id' in oldValue 
          ? (oldValue as any)._id?.toString() 
          : oldValue?.toString()
        const newId = typeof newValue === 'object' && newValue !== null && '_id' in newValue 
          ? (newValue as any)._id?.toString() 
          : newValue?.toString()
        
        if (oldId !== newId) {
          changes.before[field] = oldValue
          changes.after[field] = newValue
        }
      })
      
      // Only log if there are actual changes
      if (Object.keys(changes.before).length > 0) {
        await AuditService.logUpdate(
          'Appointment',
          updated._id as mongoose.Types.ObjectId,
          userId as unknown as mongoose.Types.ObjectId,
          changes,
          req
        )
      }
    }
    
    return sendSuccess(res, updated, 'تم تحديث الموعد بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تعديل الموعد',
      500,
      error?.message || String(error)
    )
  }
}

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const result = await AppointmentService.deleteAppointment(req.params.id)
    if (!result || !result.deleted) {
      return sendError(res, 'لم يتم العثور على الموعد', 404)
    }
    
    const { deleted, appointment } = result
    const userId = req.user?._id?.toString()
    
    // Log activity
    if (userId && deleted._id) {
      await AuditService.logDelete(
        'Appointment',
        deleted._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        appointment,
        req
      )
    }
    
    return sendSuccess(res, null, 'تم حذف الموعد بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في حذف الموعد',
      500,
      error?.message || String(error)
    )
  }
}

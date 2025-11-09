import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { AppointmentService } from '../services/appointment.service'

// إنشاء موعد جديد
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const appointment = await AppointmentService.createAppointment(req.body)
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
    const updated = await AppointmentService.updateAppointment(
      req.params.id,
      req.body
    )
    if (!updated) {
      return sendError(res, 'لم يتم العثور على الموعد', 404)
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
    const deleted = await AppointmentService.deleteAppointment(req.params.id)
    if (!deleted) {
      return sendError(res, 'لم يتم العثور على الموعد', 404)
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

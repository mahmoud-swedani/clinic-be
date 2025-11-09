import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { PatientService } from '../services/patient.service'

// إنشاء مريض جديد
export const createPatient = async (req: Request, res: Response) => {
  try {
    const patient = await PatientService.createPatient(req.body)
    return sendSuccess(res, patient, 'تم إنشاء المريض بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في إنشاء المريض',
      400,
      error?.message || String(error)
    )
  }
}

// جلب كل المرضى
export const getAllPatients = async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req)
    const { patients, total } = await PatientService.getAllPatients(page, limit)
    return sendPaginated(res, patients, { page, limit, total })
  } catch (error: any) {
    console.log(error)
    return sendError(
      res,
      'فشل في جلب المرضى',
      500,
      error?.message || String(error)
    )
  }
}

// تفاصيل مريض مع مواعيده
export const getPatientWithAppointments = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await PatientService.getPatientWithAppointments(req.params.id)
    if (!result) {
      return sendError(res, 'المريض غير موجود', 404)
    }
    return sendSuccess(res, result)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب البيانات',
      500,
      error?.message || String(error)
    )
  }
}

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const patient = await PatientService.getPatientById(req.params.id)
    if (!patient) {
      return sendError(res, 'لم يتم العثور على المريض', 404)
    }
    return sendSuccess(res, patient)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب بيانات المريض',
      500,
      error?.message || String(error)
    )
  }
}

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const patient = await PatientService.updatePatient(req.params.id, req.body)
    if (!patient) {
      return sendError(res, 'لم يتم العثور على المريض', 404)
    }
    return sendSuccess(res, patient, 'تم تحديث بيانات المريض بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تحديث بيانات المريض',
      500,
      error?.message || String(error)
    )
  }
}

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const deleted = await PatientService.deletePatient(req.params.id)
    if (!deleted) {
      return sendError(res, 'لم يتم العثور على المريض', 404)
    }
    return sendSuccess(res, null, 'تم حذف المريض بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في حذف المريض',
      500,
      error?.message || String(error)
    )
  }
}

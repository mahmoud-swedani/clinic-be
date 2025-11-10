// src/controllers/patientImmunization.controller.ts
import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { PatientImmunization } from '../models/patientImmunization.model'
import { Patient } from '../models/patient.model'

// Create immunization record
export const createPatientImmunization = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params

    // Verify patient exists
    const patient = await Patient.findById(patientId)
    if (!patient) {
      return sendError(res, 'المريض غير موجود', 404)
    }

    const immunization = await PatientImmunization.create({
      ...req.body,
      patient: patientId,
    })

    return sendSuccess(res, immunization, 'تم إضافة سجل التطعيم بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في إضافة سجل التطعيم',
      400,
      error?.message || String(error)
    )
  }
}

// Get all immunizations for a patient
export const getPatientImmunizations = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params
    const { page, limit } = parsePagination(req)

    const skip = (page - 1) * limit

    const [immunizations, total] = await Promise.all([
      PatientImmunization.find({ patient: patientId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PatientImmunization.countDocuments({ patient: patientId }),
    ])

    return sendPaginated(res, immunizations, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب سجلات التطعيم',
      500,
      error?.message || String(error)
    )
  }
}

// Get immunization by ID
export const getImmunizationById = async (req: Request, res: Response) => {
  try {
    const immunization = await PatientImmunization.findById(req.params.id).lean()
    if (!immunization) {
      return sendError(res, 'سجل التطعيم غير موجود', 404)
    }
    return sendSuccess(res, immunization)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب سجل التطعيم',
      500,
      error?.message || String(error)
    )
  }
}

// Update immunization
export const updateImmunization = async (req: Request, res: Response) => {
  try {
    const immunization = await PatientImmunization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).lean()

    if (!immunization) {
      return sendError(res, 'سجل التطعيم غير موجود', 404)
    }

    return sendSuccess(res, immunization, 'تم تحديث سجل التطعيم بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تحديث سجل التطعيم',
      500,
      error?.message || String(error)
    )
  }
}

// Delete immunization
export const deleteImmunization = async (req: Request, res: Response) => {
  try {
    const deleted = await PatientImmunization.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return sendError(res, 'سجل التطعيم غير موجود', 404)
    }
    return sendSuccess(res, null, 'تم حذف سجل التطعيم بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في حذف سجل التطعيم',
      500,
      error?.message || String(error)
    )
  }
}


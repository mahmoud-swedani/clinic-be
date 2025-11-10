// src/controllers/patientMedication.controller.ts
import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { PatientMedication } from '../models/patientMedication.model'
import { Patient } from '../models/patient.model'

// Create medication record
export const createPatientMedication = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params

    // Verify patient exists
    const patient = await Patient.findById(patientId)
    if (!patient) {
      return sendError(res, 'المريض غير موجود', 404)
    }

    const medication = await PatientMedication.create({
      ...req.body,
      patient: patientId,
    })

    return sendSuccess(res, medication, 'تم إضافة سجل الدواء بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في إضافة سجل الدواء',
      400,
      error?.message || String(error)
    )
  }
}

// Get all medications for a patient
export const getPatientMedications = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params
    const { page, limit } = parsePagination(req)

    const skip = (page - 1) * limit

    const [medications, total] = await Promise.all([
      PatientMedication.find({ patient: patientId })
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PatientMedication.countDocuments({ patient: patientId }),
    ])

    return sendPaginated(res, medications, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب سجلات الأدوية',
      500,
      error?.message || String(error)
    )
  }
}

// Get medication by ID
export const getMedicationById = async (req: Request, res: Response) => {
  try {
    const medication = await PatientMedication.findById(req.params.id).lean()
    if (!medication) {
      return sendError(res, 'سجل الدواء غير موجود', 404)
    }
    return sendSuccess(res, medication)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب سجل الدواء',
      500,
      error?.message || String(error)
    )
  }
}

// Update medication
export const updateMedication = async (req: Request, res: Response) => {
  try {
    const medication = await PatientMedication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).lean()

    if (!medication) {
      return sendError(res, 'سجل الدواء غير موجود', 404)
    }

    return sendSuccess(res, medication, 'تم تحديث سجل الدواء بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تحديث سجل الدواء',
      500,
      error?.message || String(error)
    )
  }
}

// Delete medication
export const deleteMedication = async (req: Request, res: Response) => {
  try {
    const deleted = await PatientMedication.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return sendError(res, 'سجل الدواء غير موجود', 404)
    }
    return sendSuccess(res, null, 'تم حذف سجل الدواء بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في حذف سجل الدواء',
      500,
      error?.message || String(error)
    )
  }
}


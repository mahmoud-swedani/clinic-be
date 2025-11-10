// src/controllers/patientTestResult.controller.ts
import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { PatientTestResult } from '../models/patientTestResult.model'
import { Patient } from '../models/patient.model'

// Create test result record
export const createPatientTestResult = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params

    // Verify patient exists
    const patient = await Patient.findById(patientId)
    if (!patient) {
      return sendError(res, 'المريض غير موجود', 404)
    }

    const testResult = await PatientTestResult.create({
      ...req.body,
      patient: patientId,
    })

    return sendSuccess(res, testResult, 'تم إضافة نتيجة الفحص بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في إضافة نتيجة الفحص',
      400,
      error?.message || String(error)
    )
  }
}

// Get all test results for a patient
export const getPatientTestResults = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params
    const { page, limit } = parsePagination(req)

    const skip = (page - 1) * limit

    const [testResults, total] = await Promise.all([
      PatientTestResult.find({ patient: patientId })
        .populate('doctor', 'name')
        .sort({ testDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PatientTestResult.countDocuments({ patient: patientId }),
    ])

    return sendPaginated(res, testResults, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب نتائج الفحوصات',
      500,
      error?.message || String(error)
    )
  }
}

// Get test result by ID
export const getTestResultById = async (req: Request, res: Response) => {
  try {
    const testResult = await PatientTestResult.findById(req.params.id)
      .populate('doctor', 'name')
      .lean()
    if (!testResult) {
      return sendError(res, 'نتيجة الفحص غير موجودة', 404)
    }
    return sendSuccess(res, testResult)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب نتيجة الفحص',
      500,
      error?.message || String(error)
    )
  }
}

// Update test result
export const updateTestResult = async (req: Request, res: Response) => {
  try {
    const testResult = await PatientTestResult.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('doctor', 'name')
      .lean()

    if (!testResult) {
      return sendError(res, 'نتيجة الفحص غير موجودة', 404)
    }

    return sendSuccess(res, testResult, 'تم تحديث نتيجة الفحص بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تحديث نتيجة الفحص',
      500,
      error?.message || String(error)
    )
  }
}

// Delete test result
export const deleteTestResult = async (req: Request, res: Response) => {
  try {
    const deleted = await PatientTestResult.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return sendError(res, 'نتيجة الفحص غير موجودة', 404)
    }
    return sendSuccess(res, null, 'تم حذف نتيجة الفحص بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في حذف نتيجة الفحص',
      500,
      error?.message || String(error)
    )
  }
}


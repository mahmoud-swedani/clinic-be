import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { PatientService } from '../services/patient.service'
import { AuditService } from '../services/audit.service'
import mongoose from 'mongoose'

// إنشاء مريض جديد
export const createPatient = async (req: Request, res: Response) => {
  try {
    const patient = await PatientService.createPatient(req.body)
    const userId = req.user?._id?.toString()
    
    // Log activity
    if (userId && patient._id) {
      await AuditService.logCreate(
        'Patient',
        patient._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        req
      )
    }
    
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
    const userId = req.user?._id?.toString()
    const { patients, total } = await PatientService.getAllPatients(
      page,
      limit,
      req.user, // Pass full user object
      userId
    )
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
    const userId = req.user?._id?.toString()
    const result = await PatientService.getPatientWithAppointments(
      req.params.id,
      req.user, // Pass full user object
      userId
    )
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
    const userId = req.user?._id?.toString()
    const patient = await PatientService.getPatientById(
      req.params.id,
      req.user, // Pass full user object
      userId
    )
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
    const result = await PatientService.updatePatient(req.params.id, req.body)
    if (!result || !result.updated) {
      return sendError(res, 'لم يتم العثور على المريض', 404)
    }
    
    const { updated, oldPatient } = result
    const userId = req.user?._id?.toString()
    
    // Log activity with changes
    if (userId && updated._id) {
      // Calculate what changed
      const changes: any = {
        before: {},
        after: {},
      }
      
      // Compare fields - include all patient fields
      const fieldsToCheck = [
        'fullName', 'firstName', 'fatherName', 'lastName', 'phone', 'gender',
        'dateOfBirth', 'refNumber', 'nationalId', 'idNumber', 'passportNumber',
        'maritalStatus', 'nationality', 'email', 'address', 'emergencyContact',
        'primaryReasonForVisit', 'currentMedicalHistory', 'allergies',
        'chronicDiseases', 'previousSurgeries', 'currentMedications',
        'familyHistory', 'dateFileOpening', 'lifestyle', 'bmi', 'baselineVitals',
        'appointmentAdherence', 'improvementNotes', 'patientClassification'
      ]
      
      fieldsToCheck.forEach((field) => {
        const oldValue = oldPatient?.[field as keyof typeof oldPatient]
        const newValue = updated[field as keyof typeof updated]
        
        // Special handling for date fields
        if (field === 'dateOfBirth' || field === 'dateFileOpening') {
          const oldDate = oldValue ? new Date(oldValue as any).toISOString() : null
          const newDate = newValue ? new Date(newValue as any).toISOString() : null
          if (oldDate !== newDate) {
            changes.before[field] = oldValue
            changes.after[field] = newValue
          }
          return
        }
        
        // Special handling for arrays
        if (Array.isArray(oldValue) || Array.isArray(newValue)) {
          const oldStr = JSON.stringify(oldValue || [])
          const newStr = JSON.stringify(newValue || [])
          if (oldStr !== newStr) {
            changes.before[field] = oldValue
            changes.after[field] = newValue
          }
          return
        }
        
        // Special handling for objects
        if (typeof oldValue === 'object' && oldValue !== null || typeof newValue === 'object' && newValue !== null) {
          const oldStr = JSON.stringify(oldValue || {})
          const newStr = JSON.stringify(newValue || {})
          if (oldStr !== newStr) {
            changes.before[field] = oldValue
            changes.after[field] = newValue
          }
          return
        }
        
        // Compare simple values
        const oldStr = oldValue?.toString() || ''
        const newStr = newValue?.toString() || ''
        if (oldStr !== newStr) {
          changes.before[field] = oldValue
          changes.after[field] = newValue
        }
      })
      
      // Only log if there are actual changes
      if (Object.keys(changes.before).length > 0) {
        await AuditService.logUpdate(
          'Patient',
          updated._id as mongoose.Types.ObjectId,
          userId as unknown as mongoose.Types.ObjectId,
          changes,
          req
        )
      }
    }
    
    return sendSuccess(res, updated, 'تم تحديث بيانات المريض بنجاح')
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
    const result = await PatientService.deletePatient(req.params.id)
    if (!result || !result.deleted) {
      return sendError(res, 'لم يتم العثور على المريض', 404)
    }
    
    const { deleted, patient } = result
    const userId = req.user?._id?.toString()
    
    // Log activity
    if (userId && deleted._id) {
      await AuditService.logDelete(
        'Patient',
        deleted._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        patient,
        req
      )
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

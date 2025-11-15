import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { ClientService } from '../services/client.service'
import { AuditService } from '../services/audit.service'
import mongoose from 'mongoose'

// إنشاء عميل جديد
export const createClient = async (req: Request, res: Response) => {
  try {
    const client = await ClientService.createClient(req.body)
    const userId = req.user?._id?.toString()
    
    // Log activity
    if (userId && client._id) {
      await AuditService.logCreate(
        'Client',
        client._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        req
      )
    }
    
    return sendSuccess(res, client, 'تم إنشاء العميل بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في إنشاء العميل',
      400,
      error?.message || String(error)
    )
  }
}

// جلب كل العملاء
export const getAllClients = async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req)
    const userId = req.user?._id?.toString()
    const { clients, total } = await ClientService.getAllClients(
      page,
      limit,
      req.user, // Pass full user object
      userId
    )
    return sendPaginated(res, clients, { page, limit, total })
  } catch (error: any) {
    console.log(error)
    return sendError(
      res,
      'فشل في جلب العملاء',
      500,
      error?.message || String(error)
    )
  }
}

// تفاصيل عميل مع مواعيده
export const getClientWithAppointments = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?._id?.toString()
    const result = await ClientService.getClientWithAppointments(
      req.params.id,
      req.user, // Pass full user object
      userId
    )
    if (!result) {
      return sendError(res, 'العميل غير موجود', 404)
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

export const getClientById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id?.toString()
    const client = await ClientService.getClientById(
      req.params.id,
      req.user, // Pass full user object
      userId
    )
    if (!client) {
      return sendError(res, 'لم يتم العثور على العميل', 404)
    }
    return sendSuccess(res, client)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب بيانات العميل',
      500,
      error?.message || String(error)
    )
  }
}

export const updateClient = async (req: Request, res: Response) => {
  try {
    const result = await ClientService.updateClient(req.params.id, req.body)
    if (!result || !result.updated) {
      return sendError(res, 'لم يتم العثور على العميل', 404)
    }
    
    const { updated, oldClient } = result
    const userId = req.user?._id?.toString()
    
    // Log activity with changes
    if (userId && updated._id) {
      // Calculate what changed
      const changes: any = {
        before: {},
        after: {},
      }
      
      // Compare fields - include all client fields
      const fieldsToCheck = [
        'fullName', 'firstName', 'fatherName', 'lastName', 'phone', 'gender',
        'dateOfBirth', 'refNumber', 'nationalId', 'idNumber', 'passportNumber',
        'maritalStatus', 'nationality', 'email', 'address', 'emergencyContact',
        'primaryReasonForVisit', 'currentMedicalHistory', 'allergies',
        'chronicDiseases', 'previousSurgeries', 'currentMedications',
        'familyHistory', 'dateFileOpening', 'lifestyle', 'bmi', 'baselineVitals',
        'appointmentAdherence', 'improvementNotes', 'clientClassification'
      ]
      
      fieldsToCheck.forEach((field) => {
        const oldValue = oldClient?.[field as keyof typeof oldClient]
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
          'Client',
          updated._id as mongoose.Types.ObjectId,
          userId as unknown as mongoose.Types.ObjectId,
          changes,
          req
        )
      }
    }
    
    return sendSuccess(res, updated, 'تم تحديث بيانات العميل بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تحديث بيانات العميل',
      500,
      error?.message || String(error)
    )
  }
}

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const result = await ClientService.deleteClient(req.params.id)
    if (!result || !result.deleted) {
      return sendError(res, 'لم يتم العثور على العميل', 404)
    }
    
    const { deleted, client } = result
    const userId = req.user?._id?.toString()
    
    // Log activity
    if (userId && deleted._id) {
      await AuditService.logDelete(
        'Client',
        deleted._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        client,
        req
      )
    }
    
    return sendSuccess(res, null, 'تم حذف العميل بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في حذف العميل',
      500,
      error?.message || String(error)
    )
  }
}


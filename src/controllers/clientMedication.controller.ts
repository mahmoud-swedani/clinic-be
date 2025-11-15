// src/controllers/clientMedication.controller.ts
import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { ClientMedication } from '../models/clientMedication.model'
import { Client } from '../models/client.model'

// Create medication record
export const createClientMedication = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params

    // Verify client exists
    const client = await Client.findById(clientId)
    if (!client) {
      return sendError(res, 'العميل غير موجود', 404)
    }

    const medication = await ClientMedication.create({
      ...req.body,
      client: clientId,
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

// Get all medications for a client
export const getClientMedications = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params
    const { page, limit } = parsePagination(req)

    const skip = (page - 1) * limit

    const [medications, total] = await Promise.all([
      ClientMedication.find({ client: clientId })
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClientMedication.countDocuments({ client: clientId }),
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
    const medication = await ClientMedication.findById(req.params.id).lean()
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
    const medication = await ClientMedication.findByIdAndUpdate(
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
    const deleted = await ClientMedication.findByIdAndDelete(req.params.id)
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


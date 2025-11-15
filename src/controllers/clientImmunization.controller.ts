// src/controllers/clientImmunization.controller.ts
import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { ClientImmunization } from '../models/clientImmunization.model'
import { Client } from '../models/client.model'

// Create immunization record
export const createClientImmunization = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params

    // Verify client exists
    const client = await Client.findById(clientId)
    if (!client) {
      return sendError(res, 'العميل غير موجود', 404)
    }

    const immunization = await ClientImmunization.create({
      ...req.body,
      client: clientId,
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

// Get all immunizations for a client
export const getClientImmunizations = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params
    const { page, limit } = parsePagination(req)

    const skip = (page - 1) * limit

    const [immunizations, total] = await Promise.all([
      ClientImmunization.find({ client: clientId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClientImmunization.countDocuments({ client: clientId }),
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
    const immunization = await ClientImmunization.findById(req.params.id).lean()
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
    const immunization = await ClientImmunization.findByIdAndUpdate(
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
    const deleted = await ClientImmunization.findByIdAndDelete(req.params.id)
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


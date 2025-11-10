// src/controllers/auditLog.controller.ts
import { Request, Response } from 'express'
import { AuditService } from '../services/audit.service'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'

// Get audit logs with filtering
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req)
    const filters: any = {}

    if (req.query.entityType) {
      filters.entityType = req.query.entityType
    }

    if (req.query.entityId) {
      filters.entityId = req.query.entityId
    }

    if (req.query.action) {
      filters.action = req.query.action
    }

    if (req.query.performedBy) {
      filters.performedBy = req.query.performedBy
    }

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string)
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string)
    }

    const { logs, total } = await AuditService.getAuditLogs(
      filters,
      page,
      limit
    )

    return sendPaginated(res, logs, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب سجل التدقيق',
      500,
      error?.message || String(error)
    )
  }
}

// Get audit history for a specific entity
export const getEntityAuditHistory = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : 50

    const logs = await AuditService.getEntityAuditHistory(
      entityType,
      entityId,
      limit
    )

    return sendSuccess(res, logs)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب سجل التدقيق',
      500,
      error?.message || String(error)
    )
  }
}

// Get user audit history
export const getUserAuditHistory = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : 50

    const logs = await AuditService.getUserAuditHistory(req.params.id, limit)

    return sendSuccess(res, logs)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب سجل تدقيق المستخدم',
      500,
      error?.message || String(error)
    )
  }
}

// Get appointment activities
export const getAppointmentActivities = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : 50

    const logs = await AuditService.getEntityAuditHistory(
      'Appointment',
      appointmentId,
      limit
    )

    return sendSuccess(res, logs)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب سجل أنشطة الموعد',
      500,
      error?.message || String(error)
    )
  }
}

// Get patient activities
export const getPatientActivities = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : 50

    const logs = await AuditService.getEntityAuditHistory(
      'Patient',
      patientId,
      limit
    )

    return sendSuccess(res, logs)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب سجل أنشطة المريض',
      500,
      error?.message || String(error)
    )
  }
}


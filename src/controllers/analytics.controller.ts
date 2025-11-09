// src/controllers/analytics.controller.ts
import { Request, Response } from 'express'
import { AnalyticsService } from '../services/analytics.service'
import { sendSuccess, sendError } from '../utils/apiResponse'
import { getUserRoleName } from '../services/roleLookup.service'

/**
 * Get executive analytics dashboard data
 * GET /api/analytics/executive?branchId=...&startDate=...&endDate=...
 */
export const getExecutiveAnalytics = async (req: Request, res: Response) => {
  try {
    const { branchId, startDate, endDate } = req.query

    const filters = {
      branchId: branchId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    }

    // Apply user branch filter if not owner/manager
    const userRoleName = getUserRoleName(req.user)
    const isOwnerOrManager = userRoleName === 'مالك' || userRoleName === 'مدير'
    if (!isOwnerOrManager && req.user?.branch) {
      filters.branchId = req.user.branch.toString()
    }

    const stats = await AnalyticsService.getExecutiveStats(filters)
    return sendSuccess(res, stats)
  } catch (error: any) {
    console.error('Executive Analytics Error:', error)
    return sendError(
      res,
      'فشل في جلب بيانات التحليل التنفيذي',
      500,
      error?.message || String(error)
    )
  }
}

/**
 * Get department-specific analytics
 * GET /api/analytics/departments/:id?startDate=...&endDate=...
 */
export const getDepartmentAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { startDate, endDate } = req.query

    const filters = {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    }

    const stats = await AnalyticsService.getDepartmentStats(id, filters)
    return sendSuccess(res, stats)
  } catch (error: any) {
    console.error('Department Analytics Error:', error)
    return sendError(
      res,
      'فشل في جلب بيانات تحليل القسم',
      500,
      error?.message || String(error)
    )
  }
}

/**
 * Get service-specific analytics
 * GET /api/analytics/services/:id?startDate=...&endDate=...
 */
export const getServiceAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { startDate, endDate } = req.query

    const filters = {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    }

    const stats = await AnalyticsService.getServiceStats(id, filters)
    return sendSuccess(res, stats)
  } catch (error: any) {
    console.error('Service Analytics Error:', error)
    return sendError(
      res,
      'فشل في جلب بيانات تحليل الخدمة',
      500,
      error?.message || String(error)
    )
  }
}



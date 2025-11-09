import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/apiResponse'
import { DashboardService } from '../services/dashboard.service'

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const dashboardData = await DashboardService.getDashboardData(req.user)
    return sendSuccess(res, dashboardData)
  } catch (error: any) {
    console.error('Dashboard Error:', error)
    return sendError(
      res,
      'فشل في تحميل بيانات الداشبورد',
      500,
      error?.message || String(error)
    )
  }
}

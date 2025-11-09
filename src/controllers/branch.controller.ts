import { Request, Response } from 'express'
import { Branch } from '../models/branch.model'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'

// إنشاء فرع
export const createBranch = async (req: Request, res: Response) => {
  try {
    const branch = await Branch.create(req.body)
    return sendSuccess(res, branch, 'تم إنشاء الفرع بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في إنشاء الفرع',
      400,
      error?.message || String(error)
    )
  }
}

// عرض جميع الفروع
export const getAllBranches = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = parsePagination(req)

    const [branches, total] = await Promise.all([
      Branch.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Branch.countDocuments(),
    ])

    return sendPaginated(res, branches, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الفروع',
      500,
      error?.message || String(error)
    )
  }
}

// تحديث فرع
export const updateBranch = async (req: Request, res: Response) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).lean()
    if (!branch) {
      return sendError(res, 'الفرع غير موجود', 404)
    }
    return sendSuccess(res, branch, 'تم تحديث الفرع بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تحديث الفرع',
      500,
      error?.message || String(error)
    )
  }
}

// حذف فرع
export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const deleted = await Branch.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return sendError(res, 'الفرع غير موجود', 404)
    }
    return sendSuccess(res, null, 'تم حذف الفرع بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في حذف الفرع',
      500,
      error?.message || String(error)
    )
  }
}

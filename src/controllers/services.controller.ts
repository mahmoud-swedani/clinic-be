import { Request, Response } from 'express'
import Service from '../models/services.model'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'

// إنشاء خدمة جديدة
export const createService = async (req: Request, res: Response) => {
  try {
    const service = await Service.create(req.body)
    return sendSuccess(res, service, 'تم إنشاء الخدمة بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في إنشاء الخدمة',
      400,
      error?.message || String(error)
    )
  }
}

// جلب خدمة واحدة

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id).lean()
    if (!service) {
      return sendError(res, 'لم يتم العثور على الخدمة', 404)
    }
    return sendSuccess(res, service)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الخدمة',
      500,
      error?.message || String(error)
    )
  }
}

// جلب كل الخدمات
export const getAllServices = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = parsePagination(req)

    const [services, total] = await Promise.all([
      Service.find()
        .populate('departmentId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments(),
    ])

    return sendPaginated(res, services, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الخدمات',
      500,
      error?.message || String(error)
    )
  }
}

// جلب خدمات قسم معين
export const getServicesByDepartment = async (req: Request, res: Response) => {
  try {
    const services = await Service.find({
      departmentId: req.params.departmentId,
    }).lean()
    return sendSuccess(res, services)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الخدمات لهذا القسم',
      500,
      error?.message || String(error)
    )
  }
}

// تعديل خدمة
export const updateService = async (req: Request, res: Response) => {
  try {
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).lean()
    if (!updated) {
      return sendError(res, 'الخدمة غير موجودة', 404)
    }
    return sendSuccess(res, updated, 'تم تحديث الخدمة بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تعديل الخدمة',
      400,
      error?.message || String(error)
    )
  }
}

// حذف خدمة
export const deleteService = async (req: Request, res: Response) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return sendError(res, 'الخدمة غير موجودة', 404)
    }
    return sendSuccess(res, null, 'تم حذف الخدمة بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في حذف الخدمة',
      500,
      error?.message || String(error)
    )
  }
}

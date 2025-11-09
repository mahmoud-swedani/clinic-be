import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Department } from '../models/departments.model'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'

export const getDepartments = async (req: Request, res: Response) => {
  try {
    // الحصول على branchId إما من الاستعلام أو من المستخدم (بعد التحقق من وجوده)
    const branchId = req.query.branchId || (req.user && req.user.branchId)
    if (!branchId) {
      return sendError(res, 'branchId مطلوب', 400)
    }

    const { page, limit, skip } = parsePagination(req)
    const filter = { branch: branchId }

    // جلب الأقسام المرتبطة بالفرع وترتيبها تنازليًا حسب تاريخ الإنشاء
    const [departments, total] = await Promise.all([
      Department.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Department.countDocuments(filter),
    ])

    return sendPaginated(res, departments, { page, limit, total })
  } catch (error: any) {
    console.error('Error fetching departments:', error)
    return sendError(
      res,
      'حدث خطأ أثناء جلب الأقسام',
      500,
      error?.message || String(error)
    )
  }
}

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'معرف القسم غير صحيح', 400)
    }

    const department = await Department.findById(id).lean()
    if (!department) {
      return sendError(res, 'القسم غير موجود', 404)
    }

    return sendSuccess(res, department)
  } catch (error: any) {
    return sendError(
      res,
      'حدث خطأ أثناء جلب القسم',
      500,
      error?.message || String(error)
    )
  }
}

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, branch } = req.body

    if (!name || !branch) {
      return sendError(res, 'الاسم والفرع مطلوبان', 400)
    }

    const existing = await Department.findOne({ name, branch })
    if (existing) {
      return sendError(res, 'القسم موجود مسبقاً', 409)
    }

    const newDepartment = new Department({
      name,
      description,
      branch,
    })

    await newDepartment.save()
    return sendSuccess(res, newDepartment, 'تم إنشاء القسم بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      'حدث خطأ أثناء إنشاء القسم',
      500,
      error?.message || String(error)
    )
  }
}

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'معرف القسم غير صحيح', 400)
    }

    const department = await Department.findById(id)
    if (!department) {
      return sendError(res, 'القسم غير موجود', 404)
    }

    // يمكنك تعطيل تعديل الاسم أو السماح به
    // department.name = name || department.name
    department.description = description || department.description

    await department.save()
    return sendSuccess(res, department, 'تم تحديث القسم بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'حدث خطأ أثناء تعديل القسم',
      500,
      error?.message || String(error)
    )
  }
}

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'معرف القسم غير صحيح', 400)
    }

    const department = await Department.findByIdAndDelete(id)
    if (!department) {
      return sendError(res, 'القسم غير موجود', 404)
    }

    return sendSuccess(res, null, 'تم حذف القسم بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'حدث خطأ أثناء حذف القسم',
      500,
      error?.message || String(error)
    )
  }
}

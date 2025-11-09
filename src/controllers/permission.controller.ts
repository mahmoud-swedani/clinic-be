// src/controllers/permission.controller.ts
import { Request, Response } from 'express'
import { PermissionService } from '../services/permission.service'
import { AuditService } from '../services/audit.service'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'

// Create permission
export const createPermission = async (req: Request, res: Response) => {
  try {
    const permissionData = {
      ...req.body,
      createdBy: req.user!._id,
    }

    const permission = await PermissionService.createPermission(permissionData)

    // Log audit
    await AuditService.logCreate(
      'Permission',
      permission._id,
      req.user!._id,
      req
    )

    return sendSuccess(res, permission, 'تم إنشاء الصلاحية بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      error?.message || 'فشل في إنشاء الصلاحية',
      400,
      error?.message || String(error)
    )
  }
}

// Get all permissions
export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req)
    const category = req.query.category as string | undefined

    const { permissions, total } = await PermissionService.getAllPermissions(
      page,
      limit,
      category
    )
    return sendPaginated(res, permissions, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الصلاحيات',
      500,
      error?.message || String(error)
    )
  }
}

// Get permissions by category
export const getPermissionsByCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const grouped = await PermissionService.getPermissionsByCategory()
    return sendSuccess(res, grouped)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الصلاحيات حسب الفئة',
      500,
      error?.message || String(error)
    )
  }
}

// Get permission by ID
export const getPermissionById = async (req: Request, res: Response) => {
  try {
    const permission = await PermissionService.getPermissionById(req.params.id)
    if (!permission) {
      return sendError(res, 'الصلاحية غير موجودة', 404)
    }
    return sendSuccess(res, permission)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب بيانات الصلاحية',
      500,
      error?.message || String(error)
    )
  }
}

// Update permission
export const updatePermission = async (req: Request, res: Response) => {
  try {
    const existingPermission = await PermissionService.getPermissionById(
      req.params.id
    )
    if (!existingPermission) {
      return sendError(res, 'الصلاحية غير موجودة', 404)
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user!._id,
    }

    const permission = await PermissionService.updatePermission(
      req.params.id,
      updateData
    )

    // Log audit
    await AuditService.logUpdate(
      'Permission',
      permission!._id,
      req.user!._id,
      {
        before: existingPermission,
        after: permission,
      },
      req
    )

    return sendSuccess(res, permission, 'تم تحديث الصلاحية بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      error?.message || 'فشل في تحديث الصلاحية',
      500,
      error?.message || String(error)
    )
  }
}

// Delete permission
export const deletePermission = async (req: Request, res: Response) => {
  try {
    const existingPermission = await PermissionService.getPermissionById(
      req.params.id
    )
    if (!existingPermission) {
      return sendError(res, 'الصلاحية غير موجودة', 404)
    }

    const deleted = await PermissionService.deletePermission(req.params.id)

    // Log audit
    await AuditService.logDelete(
      'Permission',
      deleted!._id,
      req.user!._id,
      existingPermission,
      req
    )

    return sendSuccess(res, deleted, 'تم حذف الصلاحية بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      error?.message || 'فشل في حذف الصلاحية',
      400,
      error?.message || String(error)
    )
  }
}

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await PermissionService.getCategories()
    return sendSuccess(res, categories)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الفئات',
      500,
      error?.message || String(error)
    )
  }
}


// src/controllers/rolePermission.controller.ts
import { Request, Response } from 'express'
import { RolePermissionService } from '../services/rolePermission.service'
import { AuditService } from '../services/audit.service'
import { sendSuccess, sendError } from '../utils/apiResponse'

// Assign permissions to role
export const assignPermissions = async (req: Request, res: Response) => {
  try {
    const { permissionIds } = req.body

    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return sendError(res, 'يجب توفير مصفوفة من معرفات الصلاحيات', 400)
    }

    const assignments = await RolePermissionService.assignPermissions(
      req.params.id,
      permissionIds,
      req.user!._id
    )

    // Log audit
    for (const assignment of assignments) {
      await AuditService.logAudit({
        entityType: 'RolePermission',
        entityId: assignment._id,
        action: 'assign-permission',
        performedBy: req.user!._id,
        req,
      })
    }

    return sendSuccess(
      res,
      assignments,
      `تم تعيين ${assignments.length} صلاحية للدور`,
      201
    )
  } catch (error: any) {
    return sendError(
      res,
      error?.message || 'فشل في تعيين الصلاحيات',
      400,
      error?.message || String(error)
    )
  }
}

// Remove permission from role
export const removePermission = async (req: Request, res: Response) => {
  try {
    const deleted = await RolePermissionService.removePermission(
      req.params.id,
      req.params.permissionId
    )

    if (!deleted) {
      return sendError(res, 'الصلاحية غير معينة لهذا الدور', 404)
    }

    // Log audit
    await AuditService.logAudit({
      entityType: 'RolePermission',
      entityId: deleted._id,
      action: 'remove-permission',
      performedBy: req.user!._id,
      req,
    })

    return sendSuccess(res, deleted, 'تم إزالة الصلاحية من الدور بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      error?.message || 'فشل في إزالة الصلاحية',
      400,
      error?.message || String(error)
    )
  }
}

// Get role permissions
export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await RolePermissionService.getRolePermissions(
      req.params.id
    )
    return sendSuccess(res, permissions)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب صلاحيات الدور',
      500,
      error?.message || String(error)
    )
  }
}

// Replace all permissions for a role
export const replaceRolePermissions = async (req: Request, res: Response) => {
  try {
    const { permissionIds } = req.body

    if (!Array.isArray(permissionIds)) {
      return sendError(res, 'يجب توفير مصفوفة من معرفات الصلاحيات', 400)
    }

    const assignments = await RolePermissionService.replaceRolePermissions(
      req.params.id,
      permissionIds,
      req.user!._id
    )

    // Log audit
    await AuditService.logAudit({
      entityType: 'RolePermission',
      entityId: req.params.id as any,
      action: 'assign-permission',
      performedBy: req.user!._id,
      req,
    })

    return sendSuccess(
      res,
      assignments,
      `تم تحديث صلاحيات الدور (${assignments.length} صلاحية)`
    )
  } catch (error: any) {
    return sendError(
      res,
      error?.message || 'فشل في تحديث صلاحيات الدور',
      400,
      error?.message || String(error)
    )
  }
}


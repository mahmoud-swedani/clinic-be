// src/controllers/role.controller.ts
import { Request, Response } from 'express'
import { RoleService } from '../services/role.service'
import { AuditService } from '../services/audit.service'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'

// Create role
export const createRole = async (req: Request, res: Response) => {
  try {
    const roleData = {
      ...req.body,
      createdBy: req.user!._id,
    }

    const role = await RoleService.createRole(roleData)

    // Log audit for role creation
    await AuditService.logCreate('Role', role._id, req.user!._id, req)

    // Log audit for permission assignments if any
    if (roleData.permissionIds && roleData.permissionIds.length > 0) {
      await AuditService.logAudit({
        entityType: 'RolePermission',
        entityId: role._id,
        action: 'assign-permission',
        performedBy: req.user!._id,
        changes: {
          permissionIds: roleData.permissionIds,
          permissionsCount: roleData.permissionIds.length,
        },
        req,
      })
    }

    return sendSuccess(res, role, 'تم إنشاء الدور بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      error?.message || 'فشل في إنشاء الدور',
      400,
      error?.message || String(error)
    )
  }
}

// Get all roles
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    // Support fetching all roles when all=true query parameter is provided
    const fetchAll = req.query.all === 'true'
    
    if (fetchAll) {
      const { roles } = await RoleService.getAllRoles(1, 0) // limit 0 means all
      return sendSuccess(res, roles)
    }

    const { page, limit } = parsePagination(req)
    const { roles, total } = await RoleService.getAllRoles(page, limit)
    return sendPaginated(res, roles, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الأدوار',
      500,
      error?.message || String(error)
    )
  }
}

// Get role by ID
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const role = await RoleService.getRoleById(req.params.id)
    if (!role) {
      return sendError(res, 'الدور غير موجود', 404)
    }
    return sendSuccess(res, role)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب بيانات الدور',
      500,
      error?.message || String(error)
    )
  }
}

// Update role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const existingRole = await RoleService.getRoleById(req.params.id)
    if (!existingRole) {
      return sendError(res, 'الدور غير موجود', 404)
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user!._id,
    }

    // Track permission changes for audit
    const existingPermissionIds = existingRole.permissions
      ? existingRole.permissions.map((p: any) => p._id.toString())
      : []
    const newPermissionIds = updateData.permissionIds || []

    const role = await RoleService.updateRole(req.params.id, updateData)

    // Log audit for role update
    await AuditService.logUpdate(
      'Role',
      role!._id,
      req.user!._id,
      {
        before: existingRole,
        after: role,
      },
      req
    )

    // Log audit for permission changes if permissions were updated
    if (updateData.permissionIds !== undefined) {
      const addedPermissions = newPermissionIds.filter(
        (id) => !existingPermissionIds.includes(id)
      )
      const removedPermissions = existingPermissionIds.filter(
        (id) => !newPermissionIds.includes(id)
      )

      await AuditService.logAudit({
        entityType: 'RolePermission',
        entityId: role!._id,
        action: 'update-permissions',
        performedBy: req.user!._id,
        changes: {
          before: existingPermissionIds,
          after: newPermissionIds,
          added: addedPermissions,
          removed: removedPermissions,
        },
        req,
      })
    }

    return sendSuccess(res, role, 'تم تحديث الدور بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      error?.message || 'فشل في تحديث الدور',
      500,
      error?.message || String(error)
    )
  }
}

// Delete role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const existingRole = await RoleService.getRoleById(req.params.id)
    if (!existingRole) {
      return sendError(res, 'الدور غير موجود', 404)
    }

    const deleted = await RoleService.deleteRole(req.params.id)

    // Log audit
    await AuditService.logDelete(
      'Role',
      deleted!._id,
      req.user!._id,
      existingRole,
      req
    )

    return sendSuccess(res, deleted, 'تم حذف الدور بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      error?.message || 'فشل في حذف الدور',
      400,
      error?.message || String(error)
    )
  }
}

// Get role permissions
export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await RoleService.getRolePermissions(req.params.id)
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


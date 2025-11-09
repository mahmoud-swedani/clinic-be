// src/services/rolePermission.service.ts
import { RolePermission } from '../models/rolePermission.model'
import { Role } from '../models/role.model'
import { Permission } from '../models/permission.model'
import mongoose from 'mongoose'

export class RolePermissionService {
  /**
   * Assign permissions to a role
   */
  static async assignPermissions(
    roleId: string,
    permissionIds: string[],
    grantedBy: mongoose.Types.ObjectId
  ) {
    // Verify role exists
    const role = await Role.findById(roleId)
    if (!role) {
      throw new Error('Role not found')
    }

    // Verify all permissions exist
    const permissions = await Permission.find({
      _id: { $in: permissionIds },
    })
    if (permissions.length !== permissionIds.length) {
      throw new Error('One or more permissions not found')
    }

    // Create role-permission assignments (skip duplicates)
    const assignments = []
    for (const permissionId of permissionIds) {
      const existing = await RolePermission.findOne({
        role: roleId,
        permission: permissionId,
      })

      if (!existing) {
        const assignment = await RolePermission.create({
          role: roleId,
          permission: permissionId,
          grantedBy,
          grantedAt: new Date(),
        })
        assignments.push(assignment)
      }
    }

    return assignments
  }

  /**
   * Remove permission from a role
   */
  static async removePermission(
    roleId: string,
    permissionId: string
  ) {
    const role = await Role.findById(roleId)
    if (!role) {
      throw new Error('Role not found')
    }

    if (role.isSystemRole) {
      // Allow removal but log it
      console.warn(
        `Removing permission from system role: ${role.name}`
      )
    }

    const deleted = await RolePermission.findOneAndDelete({
      role: roleId,
      permission: permissionId,
    })

    return deleted
  }

  /**
   * Get all permissions for a role
   */
  static async getRolePermissions(roleId: string) {
    const rolePermissions = await RolePermission.find({ role: roleId })
      .populate('permission', 'name description category')
      .populate('grantedBy', 'name email')
      .lean()

    return rolePermissions
  }

  /**
   * Check if role has a specific permission
   */
  static async hasPermission(
    roleId: string,
    permissionName: string
  ): Promise<boolean> {
    const permission = await Permission.findOne({ name: permissionName })
    if (!permission) {
      return false
    }

    const rolePermission = await RolePermission.findOne({
      role: roleId,
      permission: permission._id,
    })

    return !!rolePermission
  }

  /**
   * Get all permissions for multiple roles
   */
  static async getPermissionsForRoles(roleIds: string[]) {
    const rolePermissions = await RolePermission.find({
      role: { $in: roleIds },
    })
      .populate('permission', 'name description category')
      .lean()

    // Group by role
    const permissionsByRole: { [key: string]: any[] } = {}
    for (const rp of rolePermissions) {
      const roleId = (rp.role as any).toString()
      if (!permissionsByRole[roleId]) {
        permissionsByRole[roleId] = []
      }
      permissionsByRole[roleId].push(rp.permission)
    }

    return permissionsByRole
  }

  /**
   * Replace all permissions for a role
   */
  static async replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
    grantedBy: mongoose.Types.ObjectId
  ) {
    // Remove all existing permissions
    await RolePermission.deleteMany({ role: roleId })

    // Assign new permissions
    if (permissionIds.length > 0) {
      return await this.assignPermissions(roleId, permissionIds, grantedBy)
    }

    return []
  }
}


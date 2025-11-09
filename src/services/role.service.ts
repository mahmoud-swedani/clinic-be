// src/services/role.service.ts
import { Role } from '../models/role.model'
import { RolePermission } from '../models/rolePermission.model'
import { Permission } from '../models/permission.model'
import { RolePermissionService } from './rolePermission.service'
import mongoose from 'mongoose'

export class RoleService {
  /**
   * Create a new role
   */
  static async createRole(roleData: {
    name: string
    description?: string
    isSystemRole?: boolean
    createdBy: mongoose.Types.ObjectId
    permissionIds?: string[]
  }) {
    const { permissionIds, ...roleFields } = roleData
    const role = new Role(roleFields)
    await role.save()

    // Assign permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      await RolePermissionService.assignPermissions(
        role._id.toString(),
        permissionIds,
        roleData.createdBy
      )
    }

    // Return role with permissions populated
    return await this.getRoleById(role._id.toString())
  }

  /**
   * Get all roles with pagination
   * If limit is 0, returns all roles without pagination
   */
  static async getAllRoles(page: number = 1, limit: number = 10) {
    const skip = limit > 0 ? (page - 1) * limit : 0

    const query = Role.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })

    if (limit > 0) {
      query.skip(skip).limit(limit)
    }

    const [roles, total] = await Promise.all([
      query.lean(),
      Role.countDocuments(),
    ])

    // Get permissions for all roles efficiently
    const roleIds = roles.map((role) => role._id.toString())
    const permissionsByRole =
      roleIds.length > 0
        ? await RolePermissionService.getPermissionsForRoles(roleIds)
        : {}

    // Add permissions to each role
    const rolesWithPermissions = roles.map((role) => ({
      ...role,
      permissions: permissionsByRole[role._id.toString()] || [],
    }))

    return { roles: rolesWithPermissions, total }
  }

  /**
   * Get role by ID with permissions
   */
  static async getRoleById(id: string) {
    const role = await Role.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean()

    if (!role) {
      return null
    }

    // Get permissions for this role
    const rolePermissions = await RolePermission.find({ role: id })
      .populate('permission', 'name description category')
      .populate('grantedBy', 'name email')
      .lean()

    return {
      ...role,
      permissions: rolePermissions.map((rp) => ({
        ...rp.permission,
        grantedBy: rp.grantedBy,
        grantedAt: rp.grantedAt,
      })),
    }
  }

  /**
   * Get role by name
   */
  static async getRoleByName(name: string) {
    const role = await Role.findOne({ name }).lean()
    return role
  }

  /**
   * Update role by ID
   */
  static async updateRole(
    id: string,
    updateData: {
      name?: string
      description?: string
      updatedBy: mongoose.Types.ObjectId
      permissionIds?: string[]
    }
  ) {
    const { permissionIds, ...roleFields } = updateData
    const role = await Role.findByIdAndUpdate(id, roleFields, {
      new: true,
    })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean()

    // Update permissions if provided
    if (permissionIds !== undefined) {
      await RolePermissionService.replaceRolePermissions(
        id,
        permissionIds,
        updateData.updatedBy
      )
    }

    // Return role with permissions populated
    return await this.getRoleById(id)
  }

  /**
   * Delete role by ID (prevent deletion of system roles)
   */
  static async deleteRole(id: string) {
    const role = await Role.findById(id)
    if (!role) {
      throw new Error('Role not found')
    }

    if (role.isSystemRole) {
      throw new Error('Cannot delete system role')
    }

    // Check if role is assigned to any users
    const { User } = await import('../models/user.model')
    const usersWithRole = await User.countDocuments({ roleId: id })
    if (usersWithRole > 0) {
      throw new Error(
        `Cannot delete role: ${usersWithRole} user(s) are assigned to this role`
      )
    }

    // Delete role-permission assignments
    await RolePermission.deleteMany({ role: id })

    // Delete role
    const deleted = await Role.findByIdAndDelete(id)
    return deleted
  }

  /**
   * Get permissions for a role
   */
  static async getRolePermissions(roleId: string) {
    const rolePermissions = await RolePermission.find({ role: roleId })
      .populate('permission', 'name description category')
      .populate('grantedBy', 'name email')
      .lean()

    return rolePermissions.map((rp) => ({
      ...rp.permission,
      grantedBy: rp.grantedBy,
      grantedAt: rp.grantedAt,
    }))
  }
}


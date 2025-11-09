// src/services/authorization.service.ts
import { User } from '../models/user.model'
import { Role } from '../models/role.model'
import { RolePermission } from '../models/rolePermission.model'
import { Permission } from '../models/permission.model'
import mongoose from 'mongoose'

export class AuthorizationService {
  /**
   * Get user's role and permissions
   */
  static async getUserRoleAndPermissions(userId: string) {
    const user = await User.findById(userId)
      .populate('roleId', 'name isSystemRole')
      .lean()

    if (!user) {
      return null
    }

    // Get roleId (prefer roleId over role enum)
    let roleId: mongoose.Types.ObjectId | null = null

    if (user.roleId) {
      roleId = user.roleId as unknown as mongoose.Types.ObjectId
    } else if (user.role) {
      // Fallback to role enum and find matching role
      const role = await Role.findOne({ name: user.role })
      if (role) {
        roleId = role._id as mongoose.Types.ObjectId
      }
    }

    if (!roleId) {
      return {
        user,
        role: null,
        permissions: [],
      }
    }

    // Get permissions for this role
    const rolePermissions = await RolePermission.find({ role: roleId })
      .populate('permission', 'name')
      .lean()

    const permissions = rolePermissions.map(
      (rp) => (rp.permission as any).name
    )

    // Get role details
    const role = await Role.findById(roleId).lean()

    return {
      user,
      role,
      permissions,
    }
  }

  /**
   * Check if user has a specific permission
   */
  static async hasPermission(
    userId: string,
    permissionName: string
  ): Promise<boolean> {
    const userData = await this.getUserRoleAndPermissions(userId)
    if (!userData || !userData.permissions) {
      return false
    }

    return userData.permissions.includes(permissionName)
  }

  /**
   * Check if user has any of the specified permissions
   */
  static async hasAnyPermission(
    userId: string,
    permissionNames: string[]
  ): Promise<boolean> {
    const userData = await this.getUserRoleAndPermissions(userId)
    if (!userData || !userData.permissions) {
      return false
    }

    return permissionNames.some((perm) =>
      userData.permissions.includes(perm)
    )
  }

  /**
   * Check if user has all of the specified permissions
   */
  static async hasAllPermissions(
    userId: string,
    permissionNames: string[]
  ): Promise<boolean> {
    const userData = await this.getUserRoleAndPermissions(userId)
    if (!userData || !userData.permissions) {
      return false
    }

    return permissionNames.every((perm) =>
      userData.permissions.includes(perm)
    )
  }

  /**
   * Check if user has a specific role
   */
  static async hasRole(userId: string, roleName: string): Promise<boolean> {
    const userData = await this.getUserRoleAndPermissions(userId)
    if (!userData || !userData.role) {
      return false
    }

    return userData.role.name === roleName
  }

  /**
   * Check if user has any of the specified roles
   */
  static async hasAnyRole(
    userId: string,
    roleNames: string[]
  ): Promise<boolean> {
    const userData = await this.getUserRoleAndPermissions(userId)
    if (!userData || !userData.role) {
      return false
    }

    return roleNames.includes(userData.role.name)
  }

  /**
   * Get user's permissions as an array
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    const userData = await this.getUserRoleAndPermissions(userId)
    return userData?.permissions || []
  }
}


// src/services/permission.service.ts
import { Permission } from '../models/permission.model'
import { RolePermission } from '../models/rolePermission.model'
import mongoose from 'mongoose'

export class PermissionService {
  /**
   * Create a new permission
   */
  static async createPermission(permissionData: {
    name: string
    description?: string
    category: string
    createdBy: mongoose.Types.ObjectId
  }) {
    const permission = new Permission(permissionData)
    await permission.save()
    return permission
  }

  /**
   * Get all permissions with pagination and optional category filter
   */
  static async getAllPermissions(
    page: number = 1,
    limit: number = 10,
    category?: string
  ) {
    const skip = (page - 1) * limit
    const filter = category ? { category } : {}

    const [permissions, total] = await Promise.all([
      Permission.find(filter)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ category: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Permission.countDocuments(filter),
    ])

    return { permissions, total }
  }

  /**
   * Get permissions grouped by category
   */
  static async getPermissionsByCategory() {
    const permissions = await Permission.find()
      .sort({ category: 1, name: 1 })
      .lean()

    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {} as Record<string, typeof permissions>)

    return grouped
  }

  /**
   * Get permission by ID
   */
  static async getPermissionById(id: string) {
    const permission = await Permission.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean()
    return permission
  }

  /**
   * Get permission by name
   */
  static async getPermissionByName(name: string) {
    const permission = await Permission.findOne({ name }).lean()
    return permission
  }

  /**
   * Update permission by ID
   */
  static async updatePermission(
    id: string,
    updateData: {
      name?: string
      description?: string
      category?: string
      updatedBy: mongoose.Types.ObjectId
    }
  ) {
    const permission = await Permission.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean()
    return permission
  }

  /**
   * Delete permission by ID
   */
  static async deletePermission(id: string) {
    // Check if permission is assigned to any roles
    const rolePermissionsCount = await RolePermission.countDocuments({
      permission: id,
    })
    if (rolePermissionsCount > 0) {
      throw new Error(
        `Cannot delete permission: assigned to ${rolePermissionsCount} role(s)`
      )
    }

    const deleted = await Permission.findByIdAndDelete(id)
    return deleted
  }

  /**
   * Get all categories
   */
  static async getCategories() {
    const categories = await Permission.distinct('category')
    return categories.sort()
  }
}


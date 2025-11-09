// src/services/roleLookup.service.ts
// Service for efficient role name lookups from database with caching
import { Role } from '../models/role.model'
import mongoose from 'mongoose'

// In-memory cache for role lookups (name -> ObjectId)
let roleCache: Map<string, mongoose.Types.ObjectId> | null = null
let cacheExpiry: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Load all roles into cache
 */
async function loadRoleCache(): Promise<void> {
  const now = Date.now()
  if (roleCache && now < cacheExpiry) {
    return // Cache still valid
  }

  const roles = await Role.find({}).select('name _id').lean()
  roleCache = new Map(
    roles.map((role) => [role.name, role._id as mongoose.Types.ObjectId])
  )
  cacheExpiry = now + CACHE_TTL
}

/**
 * Get role by name from database (with caching)
 */
export async function getRoleByName(
  name: string
): Promise<mongoose.Types.ObjectId | null> {
  await loadRoleCache()
  return roleCache?.get(name) || null
}

/**
 * Get multiple role IDs by names (batch lookup)
 */
export async function getRoleIdsByNames(
  names: string[]
): Promise<Map<string, mongoose.Types.ObjectId>> {
  await loadRoleCache()
  const result = new Map<string, mongoose.Types.ObjectId>()
  
  for (const name of names) {
    const roleId = roleCache?.get(name)
    if (roleId) {
      result.set(name, roleId)
    }
  }
  
  return result
}

/**
 * Check if role names exist in database
 */
export async function validateRoleNames(
  names: string[]
): Promise<{ valid: string[]; invalid: string[] }> {
  await loadRoleCache()
  const valid: string[] = []
  const invalid: string[] = []

  for (const name of names) {
    if (roleCache?.has(name)) {
      valid.push(name)
    } else {
      invalid.push(name)
    }
  }

  return { valid, invalid }
}

/**
 * Clear the role cache (useful after role updates)
 */
export function clearRoleCache(): void {
  roleCache = null
  cacheExpiry = 0
}

/**
 * Get user's role name from database roleId or fallback to enum
 */
export function getUserRoleName(user: any): string | null {
  // Try database role first
  if (user.roleId) {
    // If roleId is populated with name
    if (typeof user.roleId === 'object' && user.roleId.name) {
      return user.roleId.name
    }
    // Otherwise, we need to look it up (but for now, fallback to enum)
  }

  // Fallback to enum field
  if (user.role) {
    return user.role
  }

  return null
}


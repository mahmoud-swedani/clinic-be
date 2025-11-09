import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.model'
import { AuthorizationService } from '../services/authorization.service'
import { getUserRoleName } from '../services/roleLookup.service'
import logger from '../utils/logger'

interface DecodedToken {
  id: string
  role: string
}

// توسيع نوع Request
declare global {
  namespace Express {
    interface Request {
      user?: any
      userPermissions?: string[]
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined

  // أولًا: من الكوكي
  if (req.cookies?.token) {
    token = req.cookies.token
  }

  // ثانيًا: من الهيدر (Authorization: Bearer ...)
  else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      path: req.path,
      ip: req.ip,
    })
    res.status(401).json({ message: 'غير مصرح - لا يوجد توكن' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('roleId', 'name isSystemRole')
      .lean()

    if (!user) {
      logger.warn('Authentication failed: User not found', {
        userId: decoded.id,
        path: req.path,
        ip: req.ip,
      })
      res.status(404).json({ message: 'المستخدم غير موجود' })
      return
    }

    // Get user permissions
    const userPermissions = await AuthorizationService.getUserPermissions(
      user._id.toString()
    )

    req.user = user
    req.userPermissions = userPermissions
    next()
  } catch (error) {
    logger.warn('Authentication failed: Invalid token', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
      ip: req.ip,
    })
    res.status(403).json({ message: 'توكن غير صالح' })
    return
  }
}
export const authorizeRoles = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(403).json({ message: 'صلاحيات غير كافية' })
      return
    }

    // Get user's role name (checks database roleId first, falls back to enum)
    const userRoleName = getUserRoleName(req.user)
    
    if (!userRoleName) {
      res.status(403).json({ message: 'صلاحيات غير كافية' })
      return
    }

    // Check if user's role matches any of the required roles
    // This works with both database roles and enum roles (backward compatibility)
    if (roles.includes(userRoleName)) {
      next()
      return
    }

    // Fallback: check via AuthorizationService (for edge cases)
    try {
      const hasRole = await AuthorizationService.hasAnyRole(
        req.user._id.toString(),
        roles
      )
      if (hasRole) {
        next()
        return
      }
    } catch (error) {
      logger.error('Error checking role authorization', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user._id,
      })
    }

    res.status(403).json({ message: 'صلاحيات غير كافية' })
  }
}

/**
 * Middleware to check if user has a specific permission
 */
export const authorizePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(403).json({ message: 'صلاحيات غير كافية' })
      return
    }

    try {
      // Check cached permissions first
      if (req.userPermissions && req.userPermissions.includes(permission)) {
        next()
        return
      }

      // Fallback: check via AuthorizationService
      const hasPermission = await AuthorizationService.hasPermission(
        req.user._id.toString(),
        permission
      )

      if (hasPermission) {
        // Update cached permissions
        if (req.userPermissions) {
          req.userPermissions.push(permission)
        }
        next()
        return
      }

      res.status(403).json({ message: 'صلاحيات غير كافية' })
    } catch (error) {
      logger.error('Error checking permission authorization', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user._id,
        permission,
      })
      res.status(500).json({ message: 'خطأ في التحقق من الصلاحيات' })
    }
  }
}

/**
 * Middleware to check if user has any of the specified permissions
 */
export const authorizeAnyPermission = (...permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(403).json({ message: 'صلاحيات غير كافية' })
      return
    }

    try {
      // Check cached permissions first
      if (
        req.userPermissions &&
        permissions.some((perm) => req.userPermissions!.includes(perm))
      ) {
        next()
        return
      }

      // Fallback: check via AuthorizationService
      const hasPermission = await AuthorizationService.hasAnyPermission(
        req.user._id.toString(),
        permissions
      )

      if (hasPermission) {
        next()
        return
      }

      res.status(403).json({ message: 'صلاحيات غير كافية' })
    } catch (error) {
      logger.error('Error checking permission authorization', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user._id,
        permissions,
      })
      res.status(500).json({ message: 'خطأ في التحقق من الصلاحيات' })
    }
  }
}

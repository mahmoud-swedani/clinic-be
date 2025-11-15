import { Request, Response } from 'express'
import { User } from '../models/user.model'
import jwt from 'jsonwebtoken'
import { sendSuccess, sendError } from '../utils/apiResponse'
import { getUserRoleName } from '../services/roleLookup.service'
import { AuthorizationService } from '../services/authorization.service'

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return sendError(res, 'المستخدم غير موجود', 401)
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return sendError(res, 'كلمة المرور غير صحيحة', 401)
    }

    // Get user permissions immediately after authentication
    const userPermissions = await AuthorizationService.getUserPermissions(
      user._id.toString()
    )

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // إرسال التوكن في الكوكيز
    // Note: domain is intentionally omitted to allow cross-site cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-site in production
      path: '/', // Ensure cookie is sent with all requests
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
      // domain is omitted - browser will handle it for cross-site cookies
    })

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          branch: user.branch,
          permissions: userPermissions,
        },
      },
      'تم تسجيل الدخول بنجاح'
    )
  } catch (error: any) {
    return sendError(
      res,
      'خطأ في تسجيل الدخول',
      500,
      error?.message || String(error)
    )
  }
}

export const getMe = async (req: Request, res: Response) => {
  const user = req.user

  if (!user) {
    return sendError(res, 'غير مصرح', 401)
  }

  // Get the actual role name from database roleId (preferred) or fallback to enum
  const roleName = getUserRoleName(user) || user.role

  // Get user permissions
  const userPermissions = await AuthorizationService.getUserPermissions(
    user._id.toString()
  )

  // Get role details if roleId exists
  let roleDetails = null
  if (user.roleId) {
    const roleData = await AuthorizationService.getUserRoleAndPermissions(
      user._id.toString()
    )
    roleDetails = roleData?.role || null
  }

  return sendSuccess(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    role: roleName,
    roleId: user.roleId,
    roleDetails,
    permissions: userPermissions,
    branch: user.branch,
  })
}

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/', // Must match the path used when setting the cookie
  })

  return sendSuccess(res, null, 'تم تسجيل الخروج بنجاح')
}

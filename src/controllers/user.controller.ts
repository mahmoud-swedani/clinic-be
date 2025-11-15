import { Request, Response } from 'express'
import { User } from '../models/user.model'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { AuditService } from '../services/audit.service'

// إنشاء مستخدم
export const createUser = async (req: Request, res: Response) => {
  try {
    const userData = { ...req.body }
    const role = userData.role || 'سكرتير'
    
    // For manager, owner, and reception (سكرتير), clear departments
    if (role === 'مدير' || role === 'مالك' || role === 'سكرتير') {
      userData.departments = []
      userData.hasAllDepartments = false
    } else {
      // For other roles (طبيب, محاسب), ensure departments or hasAllDepartments is set
      if (!userData.hasAllDepartments && (!userData.departments || userData.departments.length === 0)) {
        return sendError(
          res,
          'يجب تعيين قسم واحد على الأقل أو تفعيل خيار "جميع الأقسام" للمستخدمين من نوع طبيب أو محاسب',
          400
        )
      }
    }
    
    // Set createdBy from authenticated user
    if (req.user?._id) {
      userData.createdBy = req.user._id
    }

    const user = await User.create(userData)

    // Log audit
    if (req.user?._id) {
      await AuditService.logCreate('User', user._id, req.user._id, req)
    }

    return sendSuccess(res, user, 'تم إنشاء المستخدم بنجاح', 201)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في إنشاء المستخدم',
      400,
      error?.message || String(error)
    )
  }
}

// عرض جميع المستخدمين
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = parsePagination(req)

    const [users, total] = await Promise.all([
      User.find()
        .populate('branch')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ])

    return sendPaginated(res, users, { page, limit, total })
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب المستخدمين',
      500,
      error?.message || String(error)
    )
  }
}

// عرض مستخدم واحد
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).populate('branch').lean()
    if (!user) {
      return sendError(res, 'المستخدم غير موجود', 404)
    }
    return sendSuccess(res, user)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب بيانات المستخدم',
      500,
      error?.message || String(error)
    )
  }
}

// تحديث مستخدم
export const updateUser = async (req: Request, res: Response) => {
  try {
    const existingUser = await User.findById(req.params.id).lean()
    if (!existingUser) {
      return sendError(res, 'المستخدم غير موجود', 404)
    }

    const updateData = { ...req.body }
    const role = updateData.role || existingUser.role
    
    // For manager, owner, and reception (سكرتير), clear departments
    if (role === 'مدير' || role === 'مالك' || role === 'سكرتير') {
      updateData.departments = []
      updateData.hasAllDepartments = false
    } else {
      // For other roles (طبيب, محاسب), ensure departments or hasAllDepartments is set
      // Only validate if departments are being updated or role is being changed
      if (updateData.departments !== undefined || updateData.role !== undefined) {
        if (!updateData.hasAllDepartments && (!updateData.departments || updateData.departments.length === 0)) {
          // Check if existing user has departments
          const existingHasDepartments = existingUser.hasAllDepartments || 
            (Array.isArray(existingUser.departments) && existingUser.departments.length > 0)
          
          if (!existingHasDepartments) {
            return sendError(
              res,
              'يجب تعيين قسم واحد على الأقل أو تفعيل خيار "جميع الأقسام" للمستخدمين من نوع طبيب أو محاسب',
              400
            )
          }
        }
      }
    }
    
    // Set updatedBy from authenticated user
    if (req.user?._id) {
      updateData.updatedBy = req.user._id
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    })
      .populate('branch')
      .populate('departments')
      .lean()

    // Log audit
    if (req.user?._id) {
      await AuditService.logUpdate(
        'User',
        user!._id,
        req.user._id,
        {
          before: existingUser,
          after: user,
        },
        req
      )
    }

    return sendSuccess(res, user, 'تم تحديث المستخدم بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تحديث المستخدم',
      500,
      error?.message || String(error)
    )
  }
}

// حذف مستخدم
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).lean()
    if (!user) {
      return sendError(res, 'المستخدم غير موجود', 404)
    }

    // Soft delete: set deletedBy and deletedAt
    const deleted = await User.findByIdAndUpdate(
      req.params.id,
      {
        deletedBy: req.user?._id,
        deletedAt: new Date(),
      },
      { new: true }
    )

    // Log audit
    if (req.user?._id) {
      await AuditService.logDelete('User', user._id, req.user._id, user, req)
    }

    return sendSuccess(res, deleted, 'تم حذف المستخدم بنجاح')
  } catch (error: any) {
    return sendError(
      res,
      'فشل في حذف المستخدم',
      500,
      error?.message || String(error)
    )
  }
}

// تفعيل أو تعطيل مستخدم
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return sendError(res, 'المستخدم غير موجود', 404)
    }
    user.isActive = !user.isActive
    await user.save()
    return sendSuccess(
      res,
      user,
      `تم ${user.isActive ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`
    )
  } catch (error: any) {
    return sendError(
      res,
      'فشل في تغيير حالة المستخدم',
      500,
      error?.message || String(error)
    )
  }
}
//عرض المستخدمين الاطباء
export const getDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await User.find({ role: 'طبيب', isActive: true })
      .select('_id name email branch')
      .lean()
    return sendSuccess(res, doctors)
  } catch (error: any) {
    return sendError(
      res,
      'حدث خطأ أثناء جلب الأطباء',
      500,
      error?.message || String(error)
    )
  }
}

//عرض المستخدمين مديرين
export const getManagers = async (req: Request, res: Response) => {
  try {
    const managers = await User.find({ role: 'مدير', isActive: true })
      .select('_id name email branch')
      .lean()
    return sendSuccess(res, managers)
  } catch (error: any) {
    return sendError(
      res,
      'حدث خطأ أثناء جلب المديرين',
      500,
      error?.message || String(error)
    )
  }
}

//عرض المستخدمين محاسبين
export const getAccountants = async (req: Request, res: Response) => {
  try {
    const accountants = await User.find({
      role: 'محاسب',
      isActive: true,
    })
      .select('_id name email branch')
      .lean()
    return sendSuccess(res, accountants)
  } catch (error: any) {
    return sendError(
      res,
      'حدث خطأ أثناء جلب المحاسبين',
      500,
      error?.message || String(error)
    )
  }
}

//عرض المستخدمين سكرتيرين
export const getSecretaries = async (req: Request, res: Response) => {
  try {
    const secretaries = await User.find({
      role: 'سكرتير',
      isActive: true,
    })
      .select('_id name email branch')
      .lean()
    return sendSuccess(res, secretaries)
  } catch (error: any) {
    return sendError(
      res,
      'حدث خطأ أثناء جلب السكرتيرين',
      500,
      error?.message || String(error)
    )
  }
}

// عرض جميع المستخدمين في قسم معين
export const getUsersByDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params
    
    if (!departmentId) {
      return sendError(res, 'معرف القسم مطلوب', 400)
    }

    // Find users who:
    // 1. Have hasAllDepartments = true, OR
    // 2. Have the departmentId in their departments array
    // 3. Are active
    // 4. Are not manager, owner, or reception (they don't need departments)
    const users = await User.find({
      isActive: true,
      role: { $nin: ['مدير', 'مالك', 'سكرتير'] },
      $or: [
        { hasAllDepartments: true },
        { departments: departmentId },
      ],
    })
      .select('_id name email role branch')
      .populate('branch', 'name')
      .lean()

    return sendSuccess(res, users)
  } catch (error: any) {
    return sendError(
      res,
      'حدث خطأ أثناء جلب المستخدمين',
      500,
      error?.message || String(error)
    )
  }
}

import { z } from 'zod'

export const createUserSchema = z
  .object({
    name: z.string().min(2, 'الاسم يجب أن لا يقل عن حرفين'),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
    role: z.enum(['سكرتير', 'طبيب', 'محاسب', 'مدير', 'مالك']).optional(),
    branch: z.string().min(1, 'معرف الفرع مطلوب'),
    departments: z.array(z.string()).optional(),
    hasAllDepartments: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const role = data.role || 'سكرتير'
      // Manager, Owner, and Reception (سكرتير) don't need departments
      if (role === 'مدير' || role === 'مالك' || role === 'سكرتير') {
        return true
      }
      // For other roles (طبيب, محاسب), must have departments or hasAllDepartments
      return (
        data.hasAllDepartments === true ||
        (Array.isArray(data.departments) && data.departments.length > 0)
      )
    },
    {
      message:
        'يجب تعيين قسم واحد على الأقل أو تفعيل خيار "جميع الأقسام" للمستخدمين من نوع طبيب أو محاسب',
      path: ['departments'],
    }
  )

export const updateUserSchema = z
  .object({
    name: z.string().min(2, 'الاسم يجب أن لا يقل عن حرفين').optional(),
    email: z.string().email('البريد الإلكتروني غير صالح').optional(),
    password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف').optional(),
    role: z.enum(['سكرتير', 'طبيب', 'محاسب', 'مدير', 'مالك']).optional(),
    branch: z.string().min(1, 'معرف الفرع مطلوب').optional(),
    departments: z.array(z.string()).optional(),
    hasAllDepartments: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If role is being updated, check the new role
      // Otherwise, we need to check existing role from database (handled in controller)
      if (data.role) {
        const role = data.role
        if (role === 'مدير' || role === 'مالك' || role === 'سكرتير') {
          return true
        }
        return (
          data.hasAllDepartments === true ||
          (Array.isArray(data.departments) && data.departments.length > 0)
        )
      }
      // If role is not being updated, validation will be handled in controller
      return true
    },
    {
      message:
        'يجب تعيين قسم واحد على الأقل أو تفعيل خيار "جميع الأقسام" للمستخدمين من نوع طبيب أو محاسب',
      path: ['departments'],
    }
  )


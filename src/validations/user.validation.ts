import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن لا يقل عن حرفين'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
  role: z.enum(['سكرتير', 'طبيب', 'محاسب', 'مدير', 'مالك']).optional(),
  branch: z.string().min(1, 'معرف الفرع مطلوب'),
  isActive: z.boolean().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن لا يقل عن حرفين').optional(),
  email: z.string().email('البريد الإلكتروني غير صالح').optional(),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف').optional(),
  role: z.enum(['سكرتير', 'طبيب', 'محاسب', 'مدير', 'مالك']).optional(),
  branch: z.string().min(1, 'معرف الفرع مطلوب').optional(),
  isActive: z.boolean().optional(),
})


// src/validations/permission.validation.ts
import { z } from 'zod'

export const createPermissionSchema = z.object({
  name: z
    .string()
    .min(3, 'اسم الصلاحية يجب أن لا يقل عن 3 أحرف')
    .regex(
      /^[a-z]+\.[a-z]+(-[a-z]+)*$/,
      'اسم الصلاحية يجب أن يكون بصيغة: category.action (مثال: patients.create)'
    ),
  description: z.string().optional(),
  category: z.string().min(2, 'الفئة مطلوبة'),
})

export const updatePermissionSchema = z.object({
  name: z
    .string()
    .min(3, 'اسم الصلاحية يجب أن لا يقل عن 3 أحرف')
    .regex(
      /^[a-z]+\.[a-z]+(-[a-z]+)*$/,
      'اسم الصلاحية يجب أن يكون بصيغة: category.action'
    )
    .optional(),
  description: z.string().optional(),
  category: z.string().min(2, 'الفئة مطلوبة').optional(),
})


// src/validations/rolePermission.validation.ts
import { z } from 'zod'

export const assignPermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().min(1, 'معرف الصلاحية مطلوب'))
    .min(1, 'يجب تحديد صلاحية واحدة على الأقل'),
})

export const replacePermissionsSchema = z.object({
  permissionIds: z.array(z.string().min(1, 'معرف الصلاحية مطلوب')),
})


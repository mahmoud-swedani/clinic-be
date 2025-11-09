// src/validations/role.validation.ts
import { z } from 'zod'

export const createRoleSchema = z.object({
  name: z.string().min(2, 'اسم الدور يجب أن لا يقل عن حرفين'),
  description: z.string().optional(),
  isSystemRole: z.boolean().optional().default(false),
  permissionIds: z.array(z.string()).optional(),
})

export const updateRoleSchema = z.object({
  name: z.string().min(2, 'اسم الدور يجب أن لا يقل عن حرفين').optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
})


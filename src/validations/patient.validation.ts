import { z } from 'zod'

export const createPatientSchema = z.object({
  fullName: z.string().min(3, 'الاسم يجب أن لا يقل عن 3 أحرف'),
  phone: z.string().min(8, 'رقم الهاتف غير صالح'),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string().optional(), // سيتم تحويلها لاحقًا إلى Date
  address: z.string().optional(),
  medicalHistory: z.string().optional(),
})

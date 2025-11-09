import { z } from 'zod'

export const createAppointmentSchema = z.object({
  patient: z.string().min(1, 'معرف المريض مطلوب'),
  doctor: z.string().min(1, 'معرف الطبيب مطلوب'),
  date: z.string().or(z.date()),
  type: z.string().min(1, 'نوع الموعد مطلوب'),
  status: z.enum(['محجوز', 'نشط', 'تم', 'ملغي']).optional(),
  notes: z.string().optional(),
  service: z.string().min(1, 'معرف الخدمة مطلوب'),
  departmentId: z.string().min(1, 'معرف القسم مطلوب'),
})

export const updateAppointmentSchema = z.object({
  patient: z.string().min(1, 'معرف المريض مطلوب').optional(),
  doctor: z.string().min(1, 'معرف الطبيب مطلوب').optional(),
  date: z.string().or(z.date()).optional(),
  type: z.string().min(1, 'نوع الموعد مطلوب').optional(),
  status: z.enum(['محجوز', 'نشط', 'تم', 'ملغي']).optional(),
  notes: z.string().optional(),
  service: z.string().min(1, 'معرف الخدمة مطلوب').optional(),
  departmentId: z.string().min(1, 'معرف القسم مطلوب').optional(),
})


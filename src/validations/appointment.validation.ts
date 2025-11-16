import { z } from 'zod'

// Support both old (service) and new (services) format for backward compatibility
export const createAppointmentSchema = z.object({
  client: z.string().min(1, 'معرف العميل مطلوب'),
  doctor: z.string().min(1, 'معرف الطبيب مطلوب'),
  date: z.string().or(z.date()),
  type: z.string().min(1, 'نوع الموعد مطلوب'),
  status: z.enum(['محجوز', 'نشط', 'تم', 'ملغي']).optional(),
  notes: z.string().optional(),
  service: z.string().min(1, 'معرف الخدمة مطلوب').optional(), // Deprecated: kept for backward compatibility
  services: z.array(z.string().min(1, 'معرف الخدمة مطلوب')).min(1, 'يجب اختيار خدمة واحدة على الأقل').optional(),
  departmentId: z.string().min(1, 'معرف القسم مطلوب'),
}).refine(
  (data) => data.service || (data.services && data.services.length > 0),
  {
    message: 'يجب اختيار خدمة واحدة على الأقل',
    path: ['services'],
  }
)

export const updateAppointmentSchema = z.object({
  client: z.string().min(1, 'معرف العميل مطلوب').optional(),
  doctor: z.string().min(1, 'معرف الطبيب مطلوب').optional(),
  date: z.string().or(z.date()).optional(),
  type: z.string().min(1, 'نوع الموعد مطلوب').optional(),
  status: z.enum(['محجوز', 'نشط', 'تم', 'ملغي']).optional(),
  notes: z.string().optional(),
  service: z.string().min(1, 'معرف الخدمة مطلوب').optional(), // Deprecated: kept for backward compatibility
  services: z.array(z.string().min(1, 'معرف الخدمة مطلوب')).min(1, 'يجب اختيار خدمة واحدة على الأقل').optional(),
  departmentId: z.string().min(1, 'معرف القسم مطلوب').optional(),
})

// Schema for adding/removing services
export const appointmentServiceSchema = z.object({
  serviceId: z.string().min(1, 'معرف الخدمة مطلوب'),
})


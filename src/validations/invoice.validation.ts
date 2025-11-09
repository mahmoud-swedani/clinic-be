import { z } from 'zod'

export const createInvoiceSchema = z.object({
  patient: z.string().min(1, 'معرف المريض مطلوب'),
  appointment: z.string().min(1, 'معرف الموعد مطلوب'),
  treatmentStages: z.array(z.string()).optional(),
  totalAmount: z.number().positive('المبلغ الإجمالي يجب أن يكون رقمًا موجبًا'),
  paidAmount: z.number().min(0, 'المبلغ المدفوع يجب أن يكون رقمًا موجبًا').optional(),
  remainingAmount: z.number().min(0, 'المبلغ المتبقي يجب أن يكون رقمًا موجبًا'),
  status: z.enum(['غير مدفوعة', 'مدفوعة جزئيًا', 'مدفوعة بالكامل', 'دين معدوم']).optional(),
})

export const updateInvoiceSchema = z.object({
  patient: z.string().min(1, 'معرف المريض مطلوب').optional(),
  appointment: z.string().min(1, 'معرف الموعد مطلوب').optional(),
  treatmentStages: z.array(z.string()).optional(),
  totalAmount: z.number().positive('المبلغ الإجمالي يجب أن يكون رقمًا موجبًا').optional(),
  paidAmount: z.number().min(0, 'المبلغ المدفوع يجب أن يكون رقمًا موجبًا').optional(),
  remainingAmount: z.number().min(0, 'المبلغ المتبقي يجب أن يكون رقمًا موجبًا').optional(),
  status: z.enum(['غير مدفوعة', 'مدفوعة جزئيًا', 'مدفوعة بالكامل', 'دين معدوم']).optional(),
})


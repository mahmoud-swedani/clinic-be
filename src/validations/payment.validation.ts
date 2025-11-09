import { z } from 'zod'

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'معرف الفاتورة مطلوب'),
  amount: z.number().positive('المبلغ يجب أن يكون رقمًا موجبًا'),
  method: z.enum(['نقدًا', 'بطاقة'], {
    errorMap: () => ({ message: 'طريقة الدفع يجب أن تكون "نقدًا" أو "بطاقة"' }),
  }),
  patient: z.string().min(1, 'معرف المريض مطلوب'),
  appointment: z.string().optional(),
  date: z.string().or(z.date()).optional(),
})


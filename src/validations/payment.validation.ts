import { z } from 'zod'

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'معرف الفاتورة مطلوب'),
  amount: z.number().positive('المبلغ يجب أن يكون رقمًا موجبًا'),
  method: z.enum(['نقدًا', 'بطاقة', 'تحويل بنكي', 'أخرى'], {
    errorMap: () => ({ message: 'طريقة الدفع يجب أن تكون "نقدًا" أو "بطاقة" أو "تحويل بنكي" أو "أخرى"' }),
  }),
  client: z.string().min(1, 'معرف العميل مطلوب'),
  appointment: z.string().optional(),
  date: z.string().or(z.date()).optional(),
})


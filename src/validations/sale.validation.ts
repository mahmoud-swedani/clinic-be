import { z } from 'zod'

const saleItemSchema = z.object({
  product: z.string().min(1, 'معرف المنتج مطلوب'),
  quantity: z.number().positive('الكمية يجب أن تكون رقمًا موجبًا'),
  unitPrice: z.number().positive('سعر الوحدة يجب أن يكون رقمًا موجبًا'),
})

export const createSaleSchema = z.object({
  client: z.string().min(1, 'معرف العميل مطلوب'),
  items: z.array(saleItemSchema).min(1, 'يجب أن يحتوي على منتج واحد على الأقل'),
  totalAmount: z.number().positive('المبلغ الإجمالي يجب أن يكون رقمًا موجبًا'),
  paidAmount: z.number().min(0, 'المبلغ المدفوع يجب أن يكون رقمًا موجبًا'),
  remainingAmount: z.number().min(0, 'المبلغ المتبقي يجب أن يكون رقمًا موجبًا'),
  paymentStatus: z.enum(['paid', 'partial', 'unpaid']).optional(),
  paymentMethod: z.enum(['cash', 'card', 'insurance', 'other']).optional(),
  notes: z.string().optional(),
})


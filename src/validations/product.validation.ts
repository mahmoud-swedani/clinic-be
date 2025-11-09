import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب'),
  category: z.string().optional(),
  unit: z.enum(['قطعة', 'كغم', 'لتر', 'علبة', 'أخرى']).optional(),
  purchasePrice: z.number().positive('سعر الشراء يجب أن يكون رقمًا موجبًا'),
  sellingPrice: z.number().positive('سعر البيع يجب أن يكون رقمًا موجبًا').optional(),
  stock: z.number().min(0, 'الكمية يجب أن تكون رقمًا موجبًا').optional(),
  notes: z.string().optional(),
})

export const updateProductSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب').optional(),
  category: z.string().optional(),
  unit: z.enum(['قطعة', 'كغم', 'لتر', 'علبة', 'أخرى']).optional(),
  purchasePrice: z.number().positive('سعر الشراء يجب أن يكون رقمًا موجبًا').optional(),
  sellingPrice: z.number().positive('سعر البيع يجب أن يكون رقمًا موجبًا').optional(),
  stock: z.number().min(0, 'الكمية يجب أن تكون رقمًا موجبًا').optional(),
  notes: z.string().optional(),
})


import { z } from 'zod'

const paymentSchema = z.object({
  amount: z.number().positive('المبلغ يجب أن يكون رقمًا موجبًا'),
  paymentDate: z.string().or(z.date()),
  method: z.enum(['cash', 'check', 'transfer', 'other']),
  notes: z.string().optional(),
})

export const createFinancialRecordSchema = z.object({
  recordType: z.enum(['purchase', 'expense', 'salary']),
  invoiceNumber: z.string().optional(),
  supplierName: z.string().optional(),
  description: z.string().optional(),
  recordDate: z.string().or(z.date()).optional(),
  totalAmount: z.number().positive('المبلغ الإجمالي يجب أن يكون رقمًا موجبًا'),
  status: z.enum(['paid', 'partial', 'unpaid']).optional(),
  payments: z.array(paymentSchema).optional(),
})

export const updateFinancialRecordSchema = z.object({
  recordType: z.enum(['purchase', 'expense', 'salary']).optional(),
  invoiceNumber: z.string().optional(),
  supplierName: z.string().optional(),
  description: z.string().optional(),
  recordDate: z.string().or(z.date()).optional(),
  totalAmount: z.number().positive('المبلغ الإجمالي يجب أن يكون رقمًا موجبًا').optional(),
  status: z.enum(['paid', 'partial', 'unpaid']).optional(),
  payments: z.array(paymentSchema).optional(),
})


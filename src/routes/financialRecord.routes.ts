// src/routes/financialRecord.routes.ts

import { Router } from 'express'
import {
  createFinancialRecord,
  getAllFinancialRecords,
  getFinancialRecordById,
  addPaymentToRecord,
  deleteFinancialRecord,
} from '../controllers/financialRecord.controller'
import { validate } from '../middlewares/validate'
import { createFinancialRecordSchema } from '../validations/financialRecord.validation'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

// All financial record routes require authentication
router.use(protect)

// إنشاء سجل مالي جديد (شراء أو مصروف أو راتب)
router.post('/', validate(createFinancialRecordSchema), createFinancialRecord)

// جلب كل السجلات المالية أو فلترة حسب نوع السجل (purchase | expense | salary)
// يمكن استعمال استعلام ?recordType=...
router.get('/', getAllFinancialRecords)

// جلب سجل مالي واحد حسب الـ ID
router.get('/:id', getFinancialRecordById)

// إضافة دفعة دفع جديدة لسجل مالي معين
router.post('/:id/add-payment', addPaymentToRecord)

// حذف سجل مالي
router.delete('/:id', deleteFinancialRecord)

export default router

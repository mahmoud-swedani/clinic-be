import express from 'express'
import {
  createSale,
  getSales,
  getSaleById,
  addPayment,
  getSalePayments,
} from '../controllers/sale.controller'
import { validate } from '../middlewares/validate'
import { createSaleSchema } from '../validations/sale.validation'
import { protect } from '../middlewares/auth.middleware'

const router = express.Router()

// All sale routes require authentication
router.use(protect)

// إنشاء عملية بيع جديدة
router.post('/', validate(createSaleSchema), createSale)

// جلب كل عمليات البيع (اختياري فلترة حسب عميل)
router.get('/', getSales)

// جلب عملية بيع واحدة حسب الـ ID
router.get('/:id', getSaleById)

// إضافة دفعة جديدة لعملية بيع معينة
router.post('/:id/payments', addPayment)

// جلب كل الدفعات الخاصة بعملية بيع معينة
router.get('/:id/payments', getSalePayments)

export default router

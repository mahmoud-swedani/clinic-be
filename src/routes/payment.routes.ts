import express from 'express'
import { createPayment, getPaymentsByInvoice } from '../controllers/payment.controller'
import { protect } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate'
import { createPaymentSchema } from '../validations/payment.validation'

const router = express.Router()

// 🔐 تسجيل دفعة جديدة - فقط للمحاسب
router.post('/', protect, validate(createPaymentSchema), createPayment)

// 📄 جلب الدفعات الخاصة بفاتورة معينة
router.get('/invoice/:invoiceId', protect, getPaymentsByInvoice)

export default router

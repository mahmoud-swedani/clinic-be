import express from 'express'
import { createPayment } from '../controllers/payment.controller'
import { protect } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate'
import { createPaymentSchema } from '../validations/payment.validation'

const router = express.Router()

// 🔐 تسجيل دفعة جديدة - فقط للمحاسب
router.post('/', protect, validate(createPaymentSchema), createPayment)

export default router

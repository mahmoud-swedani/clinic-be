import express from 'express'
import { createPayment, getPaymentsByInvoice, deletePayment, recalculateInvoiceAmounts, updatePayment } from '../controllers/payment.controller'
import { protect, authorizeAnyPermission } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate'
import { createPaymentSchema, updatePaymentSchema } from '../validations/payment.validation'

const router = express.Router()

// 🔐 تسجيل دفعة جديدة - فقط للمحاسب
router.post('/', protect, validate(createPaymentSchema), createPayment)

// 📄 جلب الدفعات الخاصة بفاتورة معينة
router.get('/invoice/:invoiceId', protect, getPaymentsByInvoice)

// ✏️ تحديث دفعة وإعادة حساب الفاتورة
router.put('/:paymentId', protect, validate(updatePaymentSchema), authorizeAnyPermission('payments.edit', 'payments.update'), updatePayment)

// 🗑️ حذف دفعة وإعادة حساب الفاتورة
router.delete('/:paymentId', protect, authorizeAnyPermission('payments.delete', 'payments.edit'), deletePayment)

// 🔄 إعادة حساب مبالغ الفاتورة من جميع الدفعات
router.post('/invoice/:invoiceId/recalculate', protect, authorizeAnyPermission('invoices.edit', 'payments.edit'), recalculateInvoiceAmounts)

export default router

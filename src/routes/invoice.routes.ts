// routes/invoice.routes.ts
import express from 'express'
import {
  getUnpaidInvoices,
  getAllInvoices,
  getInvoiceById,
} from '../controllers/invoice.controller'
import { protect } from '../middlewares/auth.middleware'

const router = express.Router()

// All invoice routes require authentication
router.use(protect)

router.get('/unpaid', getUnpaidInvoices)
router.get('/:id', getInvoiceById)
router.get('/', getAllInvoices)

export default router

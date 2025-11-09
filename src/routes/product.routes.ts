// src/routes/product.routes.ts
import { Router } from 'express'
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller'
import { validate } from '../middlewares/validate'
import {
  createProductSchema,
  updateProductSchema,
} from '../validations/product.validation'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

// All product routes require authentication
router.use(protect)

// GET جميع المنتجات
router.get('/', getAllProducts)

// GET منتج واحد حسب الـ ID
router.get('/:id', getProductById)

// POST إنشاء منتج جديد
router.post('/', validate(createProductSchema), createProduct)

// PUT تحديث منتج حسب الـ ID
router.put('/:id', validate(updateProductSchema), updateProduct)

// DELETE حذف منتج حسب الـ ID
router.delete('/:id', deleteProduct)

export default router

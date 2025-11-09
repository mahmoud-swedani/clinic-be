// src/controllers/product.controller.ts
import { Request, Response } from 'express'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'
import { ProductService } from '../services/product.service'

/** GET /api/products */
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req)
    const { products, total } = await ProductService.getAllProducts(page, limit)
    return sendPaginated(res, products, { page, limit, total })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return sendError(
      res,
      'حدث خطأ أثناء استرجاع المنتجات.',
      500,
      error?.message || String(error)
    )
  }
}

/** GET /api/products/:id */
export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const product = await ProductService.getProductById(id)
    if (!product) {
      return sendError(res, 'المنتج غير موجود.', 404)
    }
    return sendSuccess(res, product)
  } catch (error: any) {
    console.error('Error fetching product by ID:', error)
    return sendError(
      res,
      'حدث خطأ أثناء استرجاع المنتج.',
      500,
      error?.message || String(error)
    )
  }
}

/** POST /api/products */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const saved = await ProductService.createProduct(req.body)
    return sendSuccess(res, saved, 'تم إنشاء المنتج بنجاح', 201)
  } catch (error: any) {
    console.error('Error creating product:', error)
    return sendError(
      res,
      error.message || 'حدث خطأ أثناء إنشاء المنتج.',
      error.message?.includes('مطلوبان') ? 400 : 500,
      error?.message || String(error)
    )
  }
}

/** PUT /api/products/:id */
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const updated = await ProductService.updateProduct(id, req.body)
    return sendSuccess(res, updated, 'تم تحديث المنتج بنجاح')
  } catch (error: any) {
    console.error('Error updating product:', error)
    return sendError(
      res,
      error.message || 'حدث خطأ أثناء تحديث المنتج.',
      error.message?.includes('غير موجود') ? 404 : 500,
      error?.message || String(error)
    )
  }
}

/** DELETE /api/products/:id */
export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await ProductService.deleteProduct(id)
    return sendSuccess(res, null, 'تم حذف المنتج بنجاح.')
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return sendError(
      res,
      error.message || 'حدث خطأ أثناء حذف المنتج.',
      error.message?.includes('غير موجود') ? 404 : 500,
      error?.message || String(error)
    )
  }
}

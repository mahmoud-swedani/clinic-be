// src/controllers/sale.controller.ts
import { Request, Response } from 'express'
import { Sale } from '../models/sale.model'
import Product from '../models/product.model'
import { Client } from '../models/client.model'
import { SalePayment } from '../models/salePayment.model'
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse'
import { parsePagination } from '../utils/pagination'

// إنشاء عملية بيع جديدة
export const createSale = async (req: Request, res: Response) => {
  try {
    const { client, items, paidAmount, paymentMethod, notes } = req.body

    // التأكد من وجود العميل
    const foundClient = await Client.findById(client)
    if (!foundClient) {
      return sendError(res, 'العميل غير موجود', 404)
    }

    // التحقق من المنتجات وحساب الإجمالي
    let totalAmount = 0
    for (const item of items) {
      const product = await Product.findById(item.product)
      if (!product) {
        return sendError(res, `المنتج غير موجود: ${item.product}`, 404)
      }
      if (product.stock < item.quantity) {
        return sendError(
          res,
          `الكمية غير متوفرة من المنتج: ${product.name}`,
          400
        )
      }

      // تقليل المخزون
      product.stock -= item.quantity
      await product.save()

      totalAmount += item.unitPrice * item.quantity
    }

    const remainingAmount = totalAmount - paidAmount
    if (remainingAmount < 0) {
      return sendError(res, 'المبلغ المدفوع أكبر من المبلغ الإجمالي', 400)
    }

    // تحديد حالة الدفع
    let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid'
    if (remainingAmount === 0) paymentStatus = 'paid'
    else if (paidAmount > 0) paymentStatus = 'partial'

    // إنشاء السجل
    const sale = await Sale.create({
      client,
      items,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentStatus,
      paymentMethod,
      notes,
    })

    return sendSuccess(res, sale, 'تم إنشاء عملية البيع بنجاح', 201)
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      'فشل في إنشاء عملية البيع',
      500,
      error?.message || String(error)
    )
  }
}

// جلب كل المبيعات
export const getSales = async (req: Request, res: Response) => {
  try {
    const { client } = req.query
    const { page, limit, skip } = parsePagination(req)

    const filter: any = {}
    if (client) {
      filter.client = client
    }

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('client', 'fullName phone')
        .populate('items.product', 'name sellingPrice')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Sale.countDocuments(filter),
    ])

    return sendPaginated(res, sales, { page, limit, total })
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      'فشل في جلب المبيعات',
      500,
      error?.message || String(error)
    )
  }
}

// جلب عملية بيع واحدة حسب الـ ID
export const getSaleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const sale = await Sale.findById(id)
      .populate('client', 'fullName phone')
      .populate('items.product', 'name sellingPrice')
      .lean()
    if (!sale) {
      return sendError(res, 'المبيعة غير موجودة', 404)
    }
    return sendSuccess(res, sale)
  } catch (error: any) {
    console.error(error)
    return sendError(
      res,
      'فشل في جلب المبيعة',
      500,
      error?.message || String(error)
    )
  }
}
export const addPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const amount = Number(req.body.amount)
    const notes = req.body.notes || ''
    const createdBy = req.user?._id // إذا عندك JWT middleware

    if (!amount || isNaN(amount) || amount <= 0) {
      return sendError(res, 'المبلغ غير صالح', 400)
    }

    const sale = await Sale.findById(id)
    if (!sale) {
      return sendError(res, 'المبيعة غير موجودة', 404)
    }

    const newPaidAmount = sale.paidAmount + amount
    const newRemainingAmount = sale.totalAmount - newPaidAmount

    if (newRemainingAmount < 0) {
      return sendError(res, 'المبلغ يتجاوز المتبقي', 400)
    }

    // تحديث المبيعة
    sale.paidAmount = newPaidAmount
    sale.remainingAmount = newRemainingAmount
    sale.paymentStatus = newRemainingAmount === 0 ? 'paid' : 'partial'

    await sale.save()

    // إنشاء سجل دفعة
    const payment = new SalePayment({
      sale: sale._id,
      amount,
      createdBy,
      notes,
    })

    await payment.save()

    return sendSuccess(res, { sale, payment }, 'تم إضافة الدفعة بنجاح')
  } catch (error: any) {
    console.error('خطأ في إضافة الدفعة:', error)
    return sendError(
      res,
      'فشل في إضافة الدفعة',
      500,
      error?.message || String(error)
    )
  }
}

export const getSalePayments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const payments = await SalePayment.find({ sale: id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean()

    return sendSuccess(res, payments)
  } catch (error: any) {
    return sendError(
      res,
      'فشل في جلب الدفعات',
      500,
      error?.message || String(error)
    )
  }
}

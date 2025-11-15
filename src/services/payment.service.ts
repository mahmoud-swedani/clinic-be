import { Payment } from '../models/payment.model'
import { Invoice } from '../models/invoice.model'
import { AuditService } from './audit.service'
import mongoose from 'mongoose'
import { Request } from 'express'

export class PaymentService {
  /**
   * Create a payment and update invoice status
   */
  static async createPayment(paymentData: any, userId: string, req?: Request) {
    const { invoiceId, amount, method, client, appointment } = paymentData

    // Validate invoice exists
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة')
    }

    // Store invoice state before update for audit log
    const invoiceBeforeUpdate = {
      paidAmount: invoice.paidAmount || 0,
      remainingAmount: invoice.remainingAmount,
      status: invoice.status,
    }

    // Validate totalAmount exists
    if (!invoice.totalAmount || invoice.totalAmount <= 0) {
      throw new Error('الفاتورة لا تحتوي على مبلغ إجمالي صحيح')
    }

    // Validate payment amount
    if (!amount || amount <= 0) {
      throw new Error('المبلغ يجب أن يكون رقمًا موجبًا')
    }

    // Ensure paidAmount is initialized
    if (!invoice.paidAmount && invoice.paidAmount !== 0) {
      invoice.paidAmount = 0
    }

    // Calculate new paid amount safely
    const newPaidAmount = (invoice.paidAmount || 0) + amount

    // Validate payment doesn't exceed total amount
    if (newPaidAmount > invoice.totalAmount) {
      throw new Error('المبلغ المدفوع لا يمكن أن يتجاوز المبلغ الإجمالي')
    }

    // Create payment
    const payment = await Payment.create({
      client,
      appointment,
      invoice: invoiceId,
      amount,
      method,
      receivedBy: userId,
    })

    // Update invoice
    invoice.paidAmount = newPaidAmount
    invoice.remainingAmount = invoice.totalAmount - invoice.paidAmount

    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = 'مدفوعة بالكامل'
      invoice.remainingAmount = 0
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'مدفوعة جزئيًا'
    }

    await invoice.save()

    // Log audit event for invoice update (payment added)
    if (userId) {
      await AuditService.logUpdate(
        'Invoice',
        invoice._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        {
          before: invoiceBeforeUpdate,
          after: {
            paidAmount: invoice.paidAmount,
            remainingAmount: invoice.remainingAmount,
            status: invoice.status,
          },
        },
        req
      )
    }

    return { payment, invoice }
  }
}


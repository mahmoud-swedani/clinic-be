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
    const { invoiceId, amount, method, client, appointment, treatmentStages, notes } = paymentData
    
    // Debug: Log received treatmentStages
    console.log('PaymentService.createPayment - Received treatmentStages:', {
      treatmentStages,
      type: typeof treatmentStages,
      isArray: Array.isArray(treatmentStages),
      length: Array.isArray(treatmentStages) ? treatmentStages.length : 'N/A'
    })

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

    // Validate treatmentStages if provided
    if (treatmentStages && Array.isArray(treatmentStages) && treatmentStages.length === 0) {
      // Empty array means no specific stages - this is valid for backward compatibility
      // But we'll save it as undefined to distinguish from explicitly set empty array
    }

    // Prepare treatmentStages - ensure it's an array of ObjectIds
    let finalTreatmentStages: mongoose.Types.ObjectId[] | undefined = undefined
    if (treatmentStages && Array.isArray(treatmentStages) && treatmentStages.length > 0) {
      // Convert string IDs to ObjectIds
      finalTreatmentStages = treatmentStages.map((ts: string | mongoose.Types.ObjectId) => {
        if (typeof ts === 'string') {
          return new mongoose.Types.ObjectId(ts)
        }
        return ts as mongoose.Types.ObjectId
      })
    }
    
    // Debug: Log what we're about to save
    console.log('PaymentService.createPayment - Saving payment with treatmentStages:', {
      finalTreatmentStages,
      count: finalTreatmentStages ? finalTreatmentStages.length : 0
    })

    // Create payment
    const payment = await Payment.create({
      client,
      appointment,
      invoice: invoiceId,
      treatmentStages: finalTreatmentStages, // Save as array of ObjectIds or undefined
      amount,
      method,
      notes: notes || undefined, // Save notes if provided
      receivedBy: userId,
    })
    
    // Debug: Log what was actually saved
    console.log('PaymentService.createPayment - Payment created:', {
      paymentId: payment._id,
      treatmentStages: payment.treatmentStages,
      treatmentStagesCount: payment.treatmentStages ? payment.treatmentStages.length : 0
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

    // Populate treatmentStages before returning
    const populatedPayment = await Payment.findById(payment._id)
      .populate('treatmentStages', 'title cost')
      .lean()
    
    return { payment: populatedPayment || payment, invoice }
  }

  /**
   * Recalculate invoice amounts based on all payments
   * This ensures invoice amounts stay in sync with actual payments
   */
  static async recalculateInvoiceAmounts(invoiceId: string) {
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة')
    }

    // Sum all payments for this invoice
    const payments = await Payment.find({ invoice: invoiceId })
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)

    // Update invoice amounts
    invoice.paidAmount = totalPaid
    invoice.remainingAmount = invoice.totalAmount - totalPaid

    // Update status
    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = 'مدفوعة بالكامل'
      invoice.remainingAmount = 0
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'مدفوعة جزئيًا'
    } else {
      invoice.status = 'غير مدفوعة'
    }

    await invoice.save()
    return invoice
  }

  /**
   * Delete a payment and recalculate invoice amounts
   */
  static async deletePayment(paymentId: string, userId: string, req?: Request) {
    const payment = await Payment.findById(paymentId)
    if (!payment) {
      throw new Error('الدفعة غير موجودة')
    }

    const invoiceId = payment.invoice.toString()

    // Store invoice state before update for audit log
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة')
    }

    const invoiceBeforeUpdate = {
      paidAmount: invoice.paidAmount || 0,
      remainingAmount: invoice.remainingAmount,
      status: invoice.status,
    }

    // Delete the payment
    await Payment.findByIdAndDelete(paymentId)

    // Recalculate invoice amounts from remaining payments
    await this.recalculateInvoiceAmounts(invoiceId)

    // Get updated invoice
    const updatedInvoice = await Invoice.findById(invoiceId)
    if (!updatedInvoice) {
      throw new Error('فشل في تحديث الفاتورة')
    }

    // Log audit event for invoice update (payment deleted)
    if (userId) {
      await AuditService.logUpdate(
        'Invoice',
        updatedInvoice._id as mongoose.Types.ObjectId,
        userId as unknown as mongoose.Types.ObjectId,
        {
          before: invoiceBeforeUpdate,
          after: {
            paidAmount: updatedInvoice.paidAmount,
            remainingAmount: updatedInvoice.remainingAmount,
            status: updatedInvoice.status,
          },
        },
        req
      )
    }

    return { payment, invoice: updatedInvoice }
  }

  /**
   * Update a payment and recalculate invoice amounts
   */
  static async updatePayment(paymentId: string, updateData: any, userId: string, req?: Request) {
    const payment = await Payment.findById(paymentId)
    if (!payment) {
      throw new Error('الدفعة غير موجودة')
    }

    const invoiceId = payment.invoice.toString()

    // Get invoice
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة')
    }

    // Store states before update for audit log
    const paymentBeforeUpdate = {
      amount: payment.amount,
      method: payment.method,
      date: payment.date,
      notes: payment.notes,
    }

    const invoiceBeforeUpdate = {
      paidAmount: invoice.paidAmount || 0,
      remainingAmount: invoice.remainingAmount,
      status: invoice.status,
    }

    // Calculate old total paid (excluding this payment)
    const oldTotalPaid = (invoice.paidAmount || 0) - payment.amount

    // Update payment fields
    if (updateData.amount !== undefined) {
      payment.amount = updateData.amount
    }
    if (updateData.method !== undefined) {
      payment.method = updateData.method
    }
    if (updateData.date !== undefined) {
      // Convert string date to Date object if needed
      if (updateData.date instanceof Date) {
        payment.date = updateData.date
      } else if (typeof updateData.date === 'string' && updateData.date.trim() !== '') {
        const dateObj = new Date(updateData.date)
        if (isNaN(dateObj.getTime())) {
          throw new Error('تاريخ الدفعة غير صحيح')
        }
        payment.date = dateObj
      } else {
        payment.date = new Date() // Default to current date if invalid
      }
    }
    if (updateData.notes !== undefined) {
      payment.notes = updateData.notes || undefined
    }

    await payment.save()

    // Recalculate invoice amounts
    await this.recalculateInvoiceAmounts(invoiceId)

    // Get updated invoice
    const updatedInvoice = await Invoice.findById(invoiceId)
    if (!updatedInvoice) {
      throw new Error('فشل في تحديث الفاتورة')
    }

    // Log audit event for payment update
    if (userId) {
      try {
        const changes: any = {
          before: paymentBeforeUpdate,
          after: {
            amount: payment.amount,
            method: payment.method,
            date: payment.date,
            notes: payment.notes,
          },
        }
        
        // Add reason if provided
        if (updateData.reason) {
          changes.reason = updateData.reason
        }
        
        await AuditService.logUpdate(
          'Payment',
          payment._id as mongoose.Types.ObjectId,
          userId as unknown as mongoose.Types.ObjectId,
          changes,
          req
        )
      } catch (auditError: any) {
        console.error('Error logging payment update audit:', auditError)
        // Don't fail the update if audit logging fails
      }

      // Log audit event for invoice update
      try {
        await AuditService.logUpdate(
          'Invoice',
          updatedInvoice._id as mongoose.Types.ObjectId,
          userId as unknown as mongoose.Types.ObjectId,
          {
            before: invoiceBeforeUpdate,
            after: {
              paidAmount: updatedInvoice.paidAmount,
              remainingAmount: updatedInvoice.remainingAmount,
              status: updatedInvoice.status,
            },
          },
          req
        )
      } catch (auditError: any) {
        console.error('Error logging invoice update audit:', auditError)
        // Don't fail the update if audit logging fails
      }
    }

    // Populate treatmentStages before returning
    const populatedPayment = await Payment.findById(payment._id)
      .populate('treatmentStages', 'title cost')
      .lean()

    return { payment: populatedPayment || payment, invoice: updatedInvoice }
  }
}


import { Payment } from '../models/payment.model'
import { Invoice } from '../models/invoice.model'

export class PaymentService {
  /**
   * Create a payment and update invoice status
   */
  static async createPayment(paymentData: any, userId: string) {
    const { invoiceId, amount, method, patient, appointment } = paymentData

    // Validate invoice exists
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة')
    }

    // Create payment
    const payment = await Payment.create({
      patient,
      appointment,
      invoice: invoiceId,
      amount,
      method,
      receivedBy: userId,
    })

    // Update invoice
    invoice.paidAmount += amount
    invoice.remainingAmount = invoice.totalAmount - invoice.paidAmount

    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = 'مدفوعة بالكامل'
      invoice.remainingAmount = 0
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'مدفوعة جزئيًا'
    }

    await invoice.save()

    return { payment, invoice }
  }
}


import { Invoice } from '../models/invoice.model'

export class InvoiceService {
  /**
   * Get unpaid invoices (unpaid or partially paid)
   */
  static async getUnpaidInvoices(page: number, limit: number) {
    const skip = (page - 1) * limit
    const filter = { status: { $in: ['غير مدفوعة', 'مدفوعة جزئيًا'] } }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('patient', 'fullName')
        .populate('appointment', 'date')
        .populate('treatmentStages', 'title cost')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ])

    return { invoices, total }
  }

  /**
   * Get all invoices with pagination
   */
  static async getAllInvoices(page: number, limit: number) {
    const skip = (page - 1) * limit

    const [invoices, total] = await Promise.all([
      Invoice.find()
        .populate('patient', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(),
    ])

    return { invoices, total }
  }
}


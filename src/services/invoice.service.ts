import { Invoice } from '../models/invoice.model'
import { getUserRoleName } from './roleLookup.service'
import mongoose from 'mongoose'

export class InvoiceService {
  /**
   * Get unpaid invoices (unpaid or partially paid)
   */
  static async getUnpaidInvoices(
    page: number,
    limit: number,
    user?: any,
    userId?: string
  ) {
    const skip = (page - 1) * limit
    const userRoleName = user ? getUserRoleName(user) : null

    // Build base filter for unpaid invoices
    const baseFilter = { status: { $in: ['غير مدفوعة', 'مدفوعة جزئيًا'] } }

    if (userRoleName === 'طبيب' && userId) {
      // Filter invoices where appointment.doctor = userId
      // Use $unwind to convert appointmentData array to object for easier matching
      const [invoices, totalResult] = await Promise.all([
        Invoice.aggregate([
          {
            $match: baseFilter,
          },
          {
            $lookup: {
              from: 'appointments',
              localField: 'appointment',
              foreignField: '_id',
              as: 'appointmentData',
            },
          },
          {
            $unwind: '$appointmentData',
          },
          {
            $match: {
              'appointmentData.doctor': new mongoose.Types.ObjectId(userId),
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]),
        Invoice.aggregate([
          {
            $match: baseFilter,
          },
          {
            $lookup: {
              from: 'appointments',
              localField: 'appointment',
              foreignField: '_id',
              as: 'appointmentData',
            },
          },
          {
            $unwind: '$appointmentData',
          },
          {
            $match: {
              'appointmentData.doctor': new mongoose.Types.ObjectId(userId),
            },
          },
          { $count: 'total' },
        ]),
      ])

      // Populate patient and other fields separately
      const invoiceIds = invoices.map((inv) => inv._id)
      const populatedInvoices = await Invoice.find({
        _id: { $in: invoiceIds },
      })
        .populate('patient', 'fullName')
        .populate('appointment', 'date')
        .populate('treatmentStages', 'title cost')
        .sort({ createdAt: -1 })
        .lean()

      return {
        invoices: populatedInvoices,
        total: totalResult[0]?.total || 0,
      }
    } else {
      // No filter for non-doctors
      const [invoices, total] = await Promise.all([
        Invoice.find(baseFilter)
          .populate('patient', 'fullName')
          .populate('appointment', 'date')
          .populate('treatmentStages', 'title cost')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Invoice.countDocuments(baseFilter),
      ])

      return { invoices, total }
    }
  }

  /**
   * Get all invoices with pagination
   */
  static async getAllInvoices(
    page: number,
    limit: number,
    user?: any,
    userId?: string
  ) {
    const skip = (page - 1) * limit
    const userRoleName = user ? getUserRoleName(user) : null

    if (userRoleName === 'طبيب' && userId) {
      // Filter invoices where appointment.doctor = userId
      // Use $unwind to convert appointmentData array to object for easier matching
      const [invoices, totalResult] = await Promise.all([
        Invoice.aggregate([
          {
            $lookup: {
              from: 'appointments',
              localField: 'appointment',
              foreignField: '_id',
              as: 'appointmentData',
            },
          },
          {
            $unwind: '$appointmentData',
          },
          {
            $match: {
              'appointmentData.doctor': new mongoose.Types.ObjectId(userId),
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]),
        Invoice.aggregate([
          {
            $lookup: {
              from: 'appointments',
              localField: 'appointment',
              foreignField: '_id',
              as: 'appointmentData',
            },
          },
          {
            $unwind: '$appointmentData',
          },
          {
            $match: {
              'appointmentData.doctor': new mongoose.Types.ObjectId(userId),
            },
          },
          { $count: 'total' },
        ]),
      ])

      // Populate patient separately
      const invoiceIds = invoices.map((inv) => inv._id)
      const populatedInvoices = await Invoice.find({
        _id: { $in: invoiceIds },
      })
        .populate('patient', 'fullName')
        .sort({ createdAt: -1 })
        .lean()

      return {
        invoices: populatedInvoices,
        total: totalResult[0]?.total || 0,
      }
    } else {
      // No filter for non-doctors
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
}


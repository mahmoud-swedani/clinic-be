// src/services/analytics.service.ts
import mongoose from 'mongoose'
import { Patient } from '../models/patient.model'
import { Appointment } from '../models/appointment.model'
import { Payment } from '../models/payment.model'
import { Invoice } from '../models/invoice.model'
import { FinancialRecord } from '../models/financialRecord.model'
import { TreatmentStage } from '../models/treatmentStage.model'
import { Sale } from '../models/sale.model'
import Product from '../models/product.model'

interface AnalyticsFilters {
  branchId?: string
  startDate?: string
  endDate?: string
  departmentId?: string
  serviceId?: string
}

interface DateFilter {
  createdAt?: {
    $gte?: Date
    $lte?: Date
  }
  date?: {
    $gte?: Date
    $lte?: Date
  }
  recordDate?: {
    $gte?: Date
    $lte?: Date
  }
}

export class AnalyticsService {
  /**
   * Build date filter for queries
   */
  private static buildDateFilter(
    startDate?: string,
    endDate?: string
  ): DateFilter {
    const filter: DateFilter = {}
    if (startDate || endDate) {
      const dateFilter: any = {}
      if (startDate) {
        dateFilter.$gte = new Date(startDate)
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate)
      }
      filter.createdAt = dateFilter
      filter.date = dateFilter
      filter.recordDate = dateFilter
    }
    return filter
  }

  /**
   * Get executive dashboard analytics
   */
  static async getExecutiveStats(filters: AnalyticsFilters) {
    const { branchId, startDate, endDate } = filters
    const dateFilter = this.buildDateFilter(startDate, endDate)

    // Build base filter
    const baseFilter: any = {}
    if (branchId) {
      baseFilter.branch = branchId
    }
    if (dateFilter.createdAt) {
      baseFilter.createdAt = dateFilter.createdAt
    }

    // Parallel queries for all metrics
    const [
      totalPatients,
      totalAppointments,
      totalRevenue,
      totalExpenses,
      totalPurchases,
      totalSalaries,
      appointmentsByStatus,
      revenueByDate,
      expensesByDate,
    ] = await Promise.all([
      // Counts
      Patient.countDocuments(baseFilter),
      Appointment.countDocuments(baseFilter),

      // Financial aggregations
      Payment.aggregate([
        ...(dateFilter.createdAt ? [{ $match: dateFilter }] : []),
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      FinancialRecord.aggregate([
        { $match: { recordType: 'expense', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      FinancialRecord.aggregate([
        { $match: { recordType: 'purchase', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      FinancialRecord.aggregate([
        { $match: { recordType: 'salary', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Appointments by status
      Appointment.aggregate([
        ...(baseFilter.createdAt ? [{ $match: baseFilter }] : []),
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Revenue by date (time series)
      Payment.aggregate([
        ...(dateFilter.createdAt ? [{ $match: dateFilter }] : []),
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' },
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Expenses by date (time series)
      FinancialRecord.aggregate([
        {
          $match: {
            recordType: { $in: ['expense', 'purchase', 'salary'] },
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$recordDate',
              },
            },
            expenses: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ])

    const totalRevenueValue = totalRevenue[0]?.total || 0
    const totalExpensesValue = totalExpenses[0]?.total || 0
    const totalPurchasesValue = totalPurchases[0]?.total || 0
    const totalSalariesValue = totalSalaries[0]?.total || 0
    const totalFinancialOut =
      totalExpensesValue + totalPurchasesValue + totalSalariesValue
    const netProfit = totalRevenueValue - totalFinancialOut

    return {
      summary: {
        totalPatients,
        totalAppointments,
        totalRevenue: totalRevenueValue,
        totalExpenses: totalExpensesValue,
        totalPurchases: totalPurchasesValue,
        totalSalaries: totalSalariesValue,
        totalFinancialOut,
        netProfit,
      },
      appointmentsByStatus: appointmentsByStatus.map((item) => ({
        status: item._id,
        count: item.count,
      })),
      revenueTimeSeries: revenueByDate.map((item) => ({
        date: item._id,
        revenue: item.revenue,
        count: item.count,
      })),
      expensesTimeSeries: expensesByDate.map((item) => ({
        date: item._id,
        expenses: item.expenses,
        count: item.count,
      })),
    }
  }

  /**
   * Get department-specific analytics
   */
  static async getDepartmentStats(
    departmentId: string,
    filters: AnalyticsFilters
  ) {
    const { startDate, endDate } = filters
    const dateFilter = this.buildDateFilter(startDate, endDate)

    // Convert string ID to ObjectId
    const deptObjectId = new mongoose.Types.ObjectId(departmentId)

    const [appointments, services, revenue] = await Promise.all([
      Appointment.countDocuments({
        departmentId: deptObjectId,
        ...dateFilter,
      }),

      Appointment.aggregate([
        {
          $match: {
            departmentId: deptObjectId,
            ...dateFilter,
          },
        },
        {
          $lookup: {
            from: 'services',
            localField: 'service',
            foreignField: '_id',
            as: 'serviceData',
          },
        },
        {
          $unwind: '$serviceData',
        },
        {
          $group: {
            _id: '$serviceData._id',
            serviceName: { $first: '$serviceData.name' },
            count: { $sum: 1 },
            totalRevenue: {
              $sum: '$serviceData.price',
            },
          },
        },
      ]),

      Payment.aggregate([
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
            'appointmentData.departmentId': deptObjectId,
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
    ])

    return {
      departmentId,
      totalAppointments: appointments,
      totalRevenue: revenue[0]?.total || 0,
      servicesBreakdown: services.map((item) => ({
        serviceId: item._id,
        serviceName: item.serviceName,
        count: item.count,
        revenue: item.totalRevenue,
      })),
    }
  }

  /**
   * Get service-specific analytics
   */
  static async getServiceStats(serviceId: string, filters: AnalyticsFilters) {
    const { startDate, endDate } = filters
    const dateFilter = this.buildDateFilter(startDate, endDate)

    // Convert string ID to ObjectId
    const serviceObjectId = new mongoose.Types.ObjectId(serviceId)

    const [appointments, revenue, appointmentsByStatus] = await Promise.all([
      Appointment.countDocuments({
        service: serviceObjectId,
        ...dateFilter,
      }),

      Payment.aggregate([
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
            'appointmentData.service': serviceObjectId,
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),

      Appointment.aggregate([
        {
          $match: {
            service: serviceObjectId,
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ])

    return {
      serviceId,
      totalAppointments: appointments,
      totalRevenue: revenue[0]?.total || 0,
      appointmentsByStatus: appointmentsByStatus.map((item) => ({
        status: item._id,
        count: item.count,
      })),
    }
  }
}


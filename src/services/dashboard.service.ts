import { User } from '../models/user.model'
import { TreatmentStage } from '../models/treatmentStage.model'
import { Payment } from '../models/payment.model'
import { Client } from '../models/client.model'
import { Invoice } from '../models/invoice.model'
import { Branch } from '../models/branch.model'
import { Appointment } from '../models/appointment.model'
import { FinancialRecord } from '../models/financialRecord.model'
import Product from '../models/product.model'
import { getUserRoleName } from './roleLookup.service'

interface UserInfo {
  branch?: any
  role?: string
  roleId?: any
}

export class DashboardService {
  /**
   * Build branch filter based on user role and branch
   */
  static buildBranchFilter(user: UserInfo) {
    const userBranch = user?.branch
    const userRoleName = getUserRoleName(user)
    const isOwnerOrManager = userRoleName === 'مالك' || userRoleName === 'مدير'

    const branchFilter: any = {}
    if (!isOwnerOrManager && userBranch) {
      branchFilter.branch = userBranch
    }
    return branchFilter
  }

  /**
   * Get dashboard statistics and recent activities
   */
  static async getDashboardData(user: UserInfo) {
    const branchFilter = this.buildBranchFilter(user)

    // Parallel queries for better performance
    const [
      totalClients,
      totalAppointments,
      totalUsers,
      totalBranches,
      totalInvoices,
      totalStages,
      totalProducts,
      productCapitalAgg,
      paymentsAgg,
      expensesAgg,
      purchasesAgg,
      salariesAgg,
      recentAppointments,
      recentPayments,
      recentInvoices,
    ] = await Promise.all([
      // Count queries
      Client.countDocuments(branchFilter),
      Appointment.countDocuments(branchFilter),
      User.countDocuments(branchFilter),
      Branch.countDocuments(),
      Invoice.countDocuments(branchFilter),
      TreatmentStage.countDocuments(branchFilter),
      Product.countDocuments(),

      // Product capital aggregation
      Product.aggregate([
        {
          $project: {
            totalValue: { $multiply: ['$purchasePrice', '$stock'] },
          },
        },
        {
          $group: {
            _id: null,
            totalCapital: { $sum: '$totalValue' },
          },
        },
      ]),

      // Revenue aggregation
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Expenses aggregation
      FinancialRecord.aggregate([
        { $match: { recordType: 'expense' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Purchases aggregation
      FinancialRecord.aggregate([
        { $match: { recordType: 'purchase' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Salaries aggregation
      FinancialRecord.aggregate([
        { $match: { recordType: 'salary' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Recent data queries
      Appointment.find(branchFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('client', 'fullName')
        .populate('doctor', 'name')
        .lean(),

      Payment.find(branchFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('client', 'fullName')
        .lean(),

      Invoice.find(branchFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('client', 'fullName')
        .lean(),
    ])

    // Extract aggregation results
    const totalProductCapital = productCapitalAgg[0]?.totalCapital || 0
    const totalRevenue = paymentsAgg[0]?.total || 0
    const totalExpenses = expensesAgg[0]?.total || 0
    const totalPurchases = purchasesAgg[0]?.total || 0
    const totalSalaries = salariesAgg[0]?.total || 0

    // Calculate derived metrics
    const totalFinancialOut = totalExpenses + totalPurchases + totalSalaries
    const netRevenueAfterPurchases = totalRevenue - totalPurchases
    const netProfit = totalRevenue - totalFinancialOut

    // Merge recent activities
    const recentActivities = [
      ...recentAppointments.map((app: any) => ({
        type: 'appointment',
        description: 'موعد جديد',
        name: app.client?.fullName || 'عميل غير معروف',
        time: app.createdAt,
      })),
      ...recentPayments.map((p: any) => ({
        type: 'payment',
        description: 'دفعة مالية',
        name: p.client?.fullName || 'عميل غير معروف',
        amount: p.amount,
        time: p.createdAt,
      })),
      ...recentInvoices.map((inv: any) => ({
        type: 'invoice',
        description: 'فاتورة جديدة',
        name: inv.client?.fullName || 'عميل غير معروف',
        total: inv.totalAmount,
        time: inv.createdAt,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return {
      stats: {
        totalClients,
        totalAppointments,
        totalUsers,
        totalBranches,
        totalInvoices,
        totalStages,
        totalProducts,
        totalProductCapital,
        totalRevenue,
        totalExpenses,
        totalPurchases,
        totalSalaries,
        totalFinancialOut,
        netRevenueAfterPurchases,
        netProfit,
      },
      recentAppointments,
      recentActivities,
    }
  }
}


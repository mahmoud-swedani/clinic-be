// scripts/migratePermissions.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Permission } from '../src/models/permission.model'
import { User } from '../src/models/user.model'

dotenv.config()

// Permissions extracted from usePermissions.ts and system analysis
const PERMISSIONS = [
  // Patients
  {
    name: 'patients.view',
    description: 'عرض المرضى',
    category: 'patients',
  },
  {
    name: 'patients.create',
    description: 'إنشاء مريض جديد',
    category: 'patients',
  },
  {
    name: 'patients.edit',
    description: 'تعديل بيانات المرضى',
    category: 'patients',
  },
  {
    name: 'patients.delete',
    description: 'حذف المرضى',
    category: 'patients',
  },
  // Appointments
  {
    name: 'appointments.view',
    description: 'عرض المواعيد',
    category: 'appointments',
  },
  {
    name: 'appointments.create',
    description: 'إنشاء موعد جديد',
    category: 'appointments',
  },
  {
    name: 'appointments.edit',
    description: 'تعديل المواعيد',
    category: 'appointments',
  },
  {
    name: 'appointments.delete',
    description: 'حذف المواعيد',
    category: 'appointments',
  },
  {
    name: 'appointments.add-treatment-stage',
    description: 'إضافة مرحلة علاجية من الموعد',
    category: 'appointments',
  },
  // Treatment Stages
  {
    name: 'treatment-stages.view',
    description: 'عرض المراحل العلاجية',
    category: 'treatment-stages',
  },
  {
    name: 'treatment-stages.create',
    description: 'إنشاء مرحلة علاجية',
    category: 'treatment-stages',
  },
  {
    name: 'treatment-stages.edit',
    description: 'تعديل المراحل العلاجية',
    category: 'treatment-stages',
  },
  {
    name: 'treatment-stages.delete',
    description: 'حذف المراحل العلاجية',
    category: 'treatment-stages',
  },
  {
    name: 'treatment-stages.view-activities',
    description: 'عرض سجل الأنشطة للمراحل العلاجية',
    category: 'treatment-stages',
  },
  // Financial
  {
    name: 'financial.view',
    description: 'عرض البيانات المالية',
    category: 'financial',
  },
  {
    name: 'financial.edit',
    description: 'تعديل البيانات المالية',
    category: 'financial',
  },
  {
    name: 'financial-records.view',
    description: 'عرض السجلات المالية',
    category: 'financial',
  },
  {
    name: 'financial-records.create',
    description: 'إنشاء سجل مالي',
    category: 'financial',
  },
  {
    name: 'financial-records.edit',
    description: 'تعديل السجلات المالية',
    category: 'financial',
  },
  {
    name: 'financial-records.delete',
    description: 'حذف السجلات المالية',
    category: 'financial',
  },
  // Invoices
  {
    name: 'invoices.view',
    description: 'عرض الفواتير',
    category: 'financial',
  },
  {
    name: 'invoices.create',
    description: 'إنشاء فاتورة',
    category: 'financial',
  },
  {
    name: 'invoices.edit',
    description: 'تعديل الفواتير',
    category: 'financial',
  },
  {
    name: 'invoices.delete',
    description: 'حذف الفواتير',
    category: 'financial',
  },
  // Payments
  {
    name: 'payments.view',
    description: 'عرض المدفوعات',
    category: 'financial',
  },
  {
    name: 'payments.create',
    description: 'إضافة دفعة',
    category: 'financial',
  },
  {
    name: 'payments.edit',
    description: 'تعديل المدفوعات',
    category: 'financial',
  },
  {
    name: 'payments.delete',
    description: 'حذف المدفوعات',
    category: 'financial',
  },
  // Products
  {
    name: 'products.view',
    description: 'عرض المنتجات',
    category: 'products',
  },
  {
    name: 'products.create',
    description: 'إنشاء منتج',
    category: 'products',
  },
  {
    name: 'products.edit',
    description: 'تعديل المنتجات',
    category: 'products',
  },
  {
    name: 'products.delete',
    description: 'حذف المنتجات',
    category: 'products',
  },
  // Sales
  {
    name: 'sales.view',
    description: 'عرض المبيعات',
    category: 'sales',
  },
  {
    name: 'sales.create',
    description: 'إنشاء عملية بيع',
    category: 'sales',
  },
  {
    name: 'sales.edit',
    description: 'تعديل المبيعات',
    category: 'sales',
  },
  {
    name: 'sales.delete',
    description: 'حذف المبيعات',
    category: 'sales',
  },
  // Departments
  {
    name: 'departments.view',
    description: 'عرض الأقسام',
    category: 'departments',
  },
  {
    name: 'departments.create',
    description: 'إنشاء قسم',
    category: 'departments',
  },
  {
    name: 'departments.edit',
    description: 'تعديل الأقسام',
    category: 'departments',
  },
  {
    name: 'departments.delete',
    description: 'حذف الأقسام',
    category: 'departments',
  },
  // Services
  {
    name: 'services.view',
    description: 'عرض الخدمات',
    category: 'services',
  },
  {
    name: 'services.create',
    description: 'إنشاء خدمة',
    category: 'services',
  },
  {
    name: 'services.edit',
    description: 'تعديل الخدمات',
    category: 'services',
  },
  {
    name: 'services.delete',
    description: 'حذف الخدمات',
    category: 'services',
  },
  // Users
  {
    name: 'users.view',
    description: 'عرض المستخدمين',
    category: 'users',
  },
  {
    name: 'users.create',
    description: 'إنشاء مستخدم',
    category: 'users',
  },
  {
    name: 'users.edit',
    description: 'تعديل المستخدمين',
    category: 'users',
  },
  {
    name: 'users.delete',
    description: 'حذف المستخدمين',
    category: 'users',
  },
  // Roles & Permissions
  {
    name: 'roles.view',
    description: 'عرض الأدوار',
    category: 'roles',
  },
  {
    name: 'roles.create',
    description: 'إنشاء دور',
    category: 'roles',
  },
  {
    name: 'roles.edit',
    description: 'تعديل الأدوار',
    category: 'roles',
  },
  {
    name: 'roles.delete',
    description: 'حذف الأدوار',
    category: 'roles',
  },
  {
    name: 'permissions.view',
    description: 'عرض الصلاحيات',
    category: 'roles',
  },
  {
    name: 'permissions.create',
    description: 'إنشاء صلاحية',
    category: 'roles',
  },
  {
    name: 'permissions.edit',
    description: 'تعديل الصلاحيات',
    category: 'roles',
  },
  {
    name: 'permissions.delete',
    description: 'حذف الصلاحيات',
    category: 'roles',
  },
  // General delete permission
  {
    name: 'delete',
    description: 'صلاحية الحذف العامة',
    category: 'general',
  },
]

const migratePermissions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI!)
    console.log('✅ Connected to MongoDB')

    // Find first admin/owner user to use as createdBy
    const adminUser = await User.findOne({ role: 'مالك' }).sort({ createdAt: 1 })
    if (!adminUser) {
      throw new Error(
        'No admin user found. Please create an admin user first using seedAdmin.ts'
      )
    }

    console.log(`📝 Using admin user ${adminUser.email} as creator`)

    // Create permissions
    const createdPermissions: { [key: string]: any } = {}

    for (const permissionData of PERMISSIONS) {
      const existingPermission = await Permission.findOne({
        name: permissionData.name,
      })
      if (existingPermission) {
        console.log(
          `⚠️  Permission "${permissionData.name}" already exists, skipping`
        )
        createdPermissions[permissionData.name] = existingPermission
        continue
      }

      const permission = await Permission.create({
        name: permissionData.name,
        description: permissionData.description,
        category: permissionData.category,
        createdBy: adminUser._id,
      })

      createdPermissions[permissionData.name] = permission
      console.log(`✅ Created permission: ${permissionData.name}`)
    }

    console.log('\n📊 Migration Summary:')
    console.log(
      `   Created/Found ${Object.keys(createdPermissions).length} permissions`
    )
    console.log('\n✅ Permission migration completed successfully!')

    return createdPermissions
  } catch (error) {
    console.error('❌ Error migrating permissions:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  migratePermissions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default migratePermissions


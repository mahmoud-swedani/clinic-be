// scripts/migrateAllRolesAndPermissions.ts
// Unified migration script that creates roles, permissions, assigns them, and updates users
// This script is idempotent - safe to run multiple times

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Role } from '../src/models/role.model'
import { Permission } from '../src/models/permission.model'
import { RolePermission } from '../src/models/rolePermission.model'
import { User } from '../src/models/user.model'

dotenv.config()

// System roles definition
const SYSTEM_ROLES = [
  { name: 'سكرتير', description: 'سكرتير - إدارة المواعيد والمرضى' },
  { name: 'طبيب', description: 'طبيب - إدارة العلاج والمراحل العلاجية' },
  { name: 'محاسب', description: 'محاسب - إدارة الحسابات المالية' },
  { name: 'مدير', description: 'مدير - إدارة شاملة للنظام' },
  { name: 'مالك', description: 'مالك - صلاحيات كاملة على النظام' },
]

// Permissions definition
const PERMISSIONS = [
  // Patients
  { name: 'patients.view', description: 'عرض المرضى', category: 'patients' },
  { name: 'patients.create', description: 'إنشاء مريض جديد', category: 'patients' },
  { name: 'patients.edit', description: 'تعديل بيانات المرضى', category: 'patients' },
  { name: 'patients.delete', description: 'حذف المرضى', category: 'patients' },
  { name: 'patients.view-appointments', description: 'عرض المواعيد من صفحة المريض', category: 'patients' },
  { name: 'patients.view-treatment-stages', description: 'عرض المراحل العلاجية من صفحة المريض', category: 'patients' },
  { name: 'patients.view-sales', description: 'عرض المبيعات من صفحة المريض', category: 'patients' },
  { name: 'patients.view-activities', description: 'عرض سجل الأنشطة للمرضى', category: 'patients' },
  // Appointments
  { name: 'appointments.view', description: 'عرض المواعيد', category: 'appointments' },
  { name: 'appointments.create', description: 'إنشاء موعد جديد', category: 'appointments' },
  { name: 'appointments.edit', description: 'تعديل المواعيد', category: 'appointments' },
  { name: 'appointments.delete', description: 'حذف المواعيد', category: 'appointments' },
  { name: 'appointments.add-treatment-stage', description: 'إضافة مرحلة علاجية من الموعد', category: 'appointments' },
  { name: 'appointments.view-activities', description: 'عرض سجل الأنشطة للمواعيد', category: 'appointments' },
  // Treatment Stages
  { name: 'treatment-stages.view', description: 'عرض المراحل العلاجية', category: 'treatment-stages' },
  { name: 'treatment-stages.create', description: 'إنشاء مرحلة علاجية', category: 'treatment-stages' },
  { name: 'treatment-stages.edit', description: 'تعديل المراحل العلاجية', category: 'treatment-stages' },
  { name: 'treatment-stages.delete', description: 'حذف المراحل العلاجية', category: 'treatment-stages' },
  { name: 'treatment-stages.view-activities', description: 'عرض سجل الأنشطة للمراحل العلاجية', category: 'treatment-stages' },
  // Financial (general financial permissions)
  { name: 'financial.view', description: 'عرض البيانات المالية', category: 'financial' },
  { name: 'financial.edit', description: 'تعديل البيانات المالية', category: 'financial' },
  // Financial Records (المشتريات)
  { name: 'financial-records.view', description: 'عرض السجلات المالية', category: 'financial-records' },
  { name: 'financial-records.create', description: 'إنشاء سجل مالي', category: 'financial-records' },
  { name: 'financial-records.edit', description: 'تعديل السجلات المالية', category: 'financial-records' },
  { name: 'financial-records.delete', description: 'حذف السجلات المالية', category: 'financial-records' },
  // Invoices (الفواتير)
  { name: 'invoices.view', description: 'عرض الفواتير', category: 'invoices' },
  { name: 'invoices.create', description: 'إنشاء فاتورة', category: 'invoices' },
  { name: 'invoices.edit', description: 'تعديل الفواتير', category: 'invoices' },
  { name: 'invoices.delete', description: 'حذف الفواتير', category: 'invoices' },
  { name: 'invoices.view-activities', description: 'عرض سجل الأنشطة للفواتير', category: 'invoices' },
  // Payments (المدفوعات)
  { name: 'payments.view', description: 'عرض المدفوعات', category: 'payments' },
  { name: 'payments.create', description: 'إضافة دفعة', category: 'payments' },
  { name: 'payments.edit', description: 'تعديل المدفوعات', category: 'payments' },
  { name: 'payments.delete', description: 'حذف المدفوعات', category: 'payments' },
  // Products
  { name: 'products.view', description: 'عرض المنتجات', category: 'products' },
  { name: 'products.create', description: 'إنشاء منتج', category: 'products' },
  { name: 'products.edit', description: 'تعديل المنتجات', category: 'products' },
  { name: 'products.delete', description: 'حذف المنتجات', category: 'products' },
  // Sales
  { name: 'sales.view', description: 'عرض المبيعات', category: 'sales' },
  { name: 'sales.create', description: 'إنشاء عملية بيع', category: 'sales' },
  { name: 'sales.edit', description: 'تعديل المبيعات', category: 'sales' },
  { name: 'sales.delete', description: 'حذف المبيعات', category: 'sales' },
  // Departments
  { name: 'departments.view', description: 'عرض الأقسام', category: 'departments' },
  { name: 'departments.create', description: 'إنشاء قسم', category: 'departments' },
  { name: 'departments.edit', description: 'تعديل الأقسام', category: 'departments' },
  { name: 'departments.delete', description: 'حذف الأقسام', category: 'departments' },
  // Services
  { name: 'services.view', description: 'عرض الخدمات', category: 'services' },
  { name: 'services.create', description: 'إنشاء خدمة', category: 'services' },
  { name: 'services.edit', description: 'تعديل الخدمات', category: 'services' },
  { name: 'services.delete', description: 'حذف الخدمات', category: 'services' },
  // Users
  { name: 'users.view', description: 'عرض المستخدمين', category: 'users' },
  { name: 'users.create', description: 'إنشاء مستخدم', category: 'users' },
  { name: 'users.edit', description: 'تعديل المستخدمين', category: 'users' },
  { name: 'users.delete', description: 'حذف المستخدمين', category: 'users' },
  // Roles & Permissions
  { name: 'roles.view', description: 'عرض الأدوار', category: 'roles' },
  { name: 'roles.create', description: 'إنشاء دور', category: 'roles' },
  { name: 'roles.edit', description: 'تعديل الأدوار', category: 'roles' },
  { name: 'roles.delete', description: 'حذف الأدوار', category: 'roles' },
  { name: 'permissions.view', description: 'عرض الصلاحيات', category: 'roles' },
  { name: 'permissions.create', description: 'إنشاء صلاحية', category: 'roles' },
  { name: 'permissions.edit', description: 'تعديل الصلاحيات', category: 'roles' },
  { name: 'permissions.delete', description: 'حذف الصلاحيات', category: 'roles' },
  // General delete permission
  { name: 'delete', description: 'صلاحية الحذف العامة', category: 'general' },
]

// Permission assignments for each role
const ROLE_PERMISSIONS: { [key: string]: string[] } = {
  مالك: [
    'patients.view', 'patients.create', 'patients.edit', 'patients.delete',
    'patients.view-appointments', 'patients.view-treatment-stages', 'patients.view-sales', 'patients.view-activities',
    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.delete', 'appointments.add-treatment-stage', 'appointments.view-activities',
    'treatment-stages.view', 'treatment-stages.create', 'treatment-stages.edit', 'treatment-stages.delete', 'treatment-stages.view-activities',
    'financial.view', 'financial.edit',
    'financial-records.view', 'financial-records.create', 'financial-records.edit', 'financial-records.delete',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.view-activities',
    'payments.view', 'payments.create', 'payments.edit', 'payments.delete',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
    'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
    'services.view', 'services.create', 'services.edit', 'services.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
    'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete',
    'delete',
  ],
  مدير: [
    'patients.view', 'patients.create', 'patients.edit', 'patients.delete',
    'patients.view-appointments', 'patients.view-treatment-stages', 'patients.view-sales', 'patients.view-activities',
    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.delete', 'appointments.add-treatment-stage', 'appointments.view-activities',
    'treatment-stages.view', 'treatment-stages.create', 'treatment-stages.edit', 'treatment-stages.delete', 'treatment-stages.view-activities',
    'financial.view', 'financial.edit',
    'financial-records.view', 'financial-records.create', 'financial-records.edit', 'financial-records.delete',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.view-activities',
    'payments.view', 'payments.create', 'payments.edit', 'payments.delete',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
    'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
    'services.view', 'services.create', 'services.edit', 'services.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'delete',
  ],
  طبيب: [
    'patients.view',
    'patients.view-appointments', 'patients.view-treatment-stages', 'patients.view-activities',
    'appointments.view', 'appointments.add-treatment-stage', 'appointments.view-activities',
    'treatment-stages.view', 'treatment-stages.create', 'treatment-stages.edit', 'treatment-stages.delete', 'treatment-stages.view-activities',
  ],
  محاسب: [
    'patients.view-appointments', 'patients.view-sales',
    'financial.view', 'financial.edit',
    'financial-records.view', 'financial-records.create', 'financial-records.edit',
    'invoices.view', 'invoices.create', 'invoices.edit',
    'payments.view', 'payments.create', 'payments.edit',
  ],
  سكرتير: [
    'patients.view', 'patients.create', 'patients.edit',
    'patients.view-appointments', 'patients.view-activities',
    'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.add-treatment-stage', 'appointments.view-activities',
  ],
}

const migrateAllRolesAndPermissions = async () => {
  try {
    console.log('🚀 Starting Role & Permission Migration\n')
    console.log('='.repeat(60))

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI!)
    console.log('✅ Connected to MongoDB\n')

    // Step 1: Find admin user
    console.log('📌 Step 1: Finding admin user')
    console.log('-'.repeat(60))
    const adminUser = await User.findOne({ role: 'مالك' }).sort({ createdAt: 1 })
    if (!adminUser) {
      throw new Error(
        '❌ No admin user found. Please create an admin user first using: npm run seed:admin'
      )
    }
    console.log(`✅ Found admin user: ${adminUser.email} (${adminUser._id})\n`)

    // Step 2: Create roles
    console.log('📌 Step 2: Creating/Verifying Roles')
    console.log('-'.repeat(60))
    const createdRoles: { [key: string]: any } = {}

    for (const roleData of SYSTEM_ROLES) {
      const existingRole = await Role.findOne({ name: roleData.name })
      if (existingRole) {
        console.log(`⚠️  Role "${roleData.name}" already exists, skipping`)
        createdRoles[roleData.name] = existingRole
        continue
      }

      const role = await Role.create({
        name: roleData.name,
        description: roleData.description,
        isSystemRole: true,
        createdBy: adminUser._id,
        updatedBy: adminUser._id,
      })

      createdRoles[roleData.name] = role
      console.log(`✅ Created role: ${roleData.name}`)
    }
    console.log(`\n📊 Created/Found ${Object.keys(createdRoles).length} roles\n`)

    // Step 3: Create permissions
    console.log('📌 Step 3: Creating/Verifying Permissions')
    console.log('-'.repeat(60))
    const createdPermissions: { [key: string]: any } = {}

    for (const permissionData of PERMISSIONS) {
      const existingPermission = await Permission.findOne({
        name: permissionData.name,
      })
      if (existingPermission) {
        console.log(`⚠️  Permission "${permissionData.name}" already exists, skipping`)
        createdPermissions[permissionData.name] = existingPermission
        continue
      }

      const permission = await Permission.create({
        name: permissionData.name,
        description: permissionData.description,
        category: permissionData.category,
        createdBy: adminUser._id,
        updatedBy: adminUser._id,
      })

      createdPermissions[permissionData.name] = permission
      console.log(`✅ Created permission: ${permissionData.name}`)
    }
    console.log(`\n📊 Created/Found ${Object.keys(createdPermissions).length} permissions\n`)

    // Step 4: Assign permissions to roles
    console.log('📌 Step 4: Assigning Permissions to Roles')
    console.log('-'.repeat(60))
    let totalAssigned = 0

    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
      const role = createdRoles[roleName]
      if (!role) {
        console.log(`⚠️  Role "${roleName}" not found, skipping`)
        continue
      }

      console.log(`\n📋 Processing role: ${roleName}`)
      let roleAssigned = 0

      for (const permissionName of permissionNames) {
        const permission = createdPermissions[permissionName]
        if (!permission) {
          console.log(`   ⚠️  Permission "${permissionName}" not found, skipping`)
          continue
        }

        // Check if assignment already exists
        const existing = await RolePermission.findOne({
          role: role._id,
          permission: permission._id,
        })

        if (existing) {
          continue // Skip silently if already assigned
        }

        await RolePermission.create({
          role: role._id,
          permission: permission._id,
          grantedBy: adminUser._id,
          grantedAt: new Date(),
        })

        roleAssigned++
        totalAssigned++
      }

      console.log(`   ✅ Assigned ${roleAssigned} permissions to ${roleName}`)
    }
    console.log(`\n📊 Total permissions assigned: ${totalAssigned}\n`)

    // Step 5: Update users with roleId
    console.log('📌 Step 5: Updating Users with roleId')
    console.log('-'.repeat(60))
    const users = await User.find({})
    console.log(`📝 Found ${users.length} users to process`)

    let usersUpdated = 0
    let usersSkipped = 0

    for (const user of users) {
      // Skip if roleId already exists
      if (user.roleId) {
        usersSkipped++
        continue
      }

      // Find matching role
      const role = createdRoles[user.role]
      if (!role) {
        console.log(`⚠️  Role "${user.role}" not found for user ${user.email}, skipping`)
        usersSkipped++
        continue
      }

      // Update user with roleId and audit fields
      const updateData: any = {
        roleId: role._id,
      }

      // Set createdBy if not set
      if (!user.createdBy && adminUser) {
        updateData.createdBy = adminUser._id
      }

      // Set updatedBy
      if (adminUser) {
        updateData.updatedBy = adminUser._id
      }

      await User.findByIdAndUpdate(user._id, updateData)
      console.log(`✅ Updated user ${user.email} with roleId: ${role.name}`)
      usersUpdated++
    }

    console.log(`\n📊 Users Summary:`)
    console.log(`   Updated: ${usersUpdated}`)
    console.log(`   Skipped: ${usersSkipped} (already have roleId)\n`)

    // Final summary
    console.log('='.repeat(60))
    console.log('✅ Migration completed successfully!')
    console.log('='.repeat(60))
    console.log('\n📊 Final Summary:')
    console.log(`   Roles: ${Object.keys(createdRoles).length}`)
    console.log(`   Permissions: ${Object.keys(createdPermissions).length}`)
    console.log(`   Role-Permission Assignments: ${totalAssigned}`)
    console.log(`   Users Updated: ${usersUpdated}`)
    console.log('\n🎉 All data has been migrated to the database!')
    console.log('   You can now use the Role Management UI to view and manage roles.\n')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  migrateAllRolesAndPermissions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default migrateAllRolesAndPermissions


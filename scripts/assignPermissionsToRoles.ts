// scripts/assignPermissionsToRoles.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Role } from '../src/models/role.model'
import { Permission } from '../src/models/permission.model'
import { RolePermission } from '../src/models/rolePermission.model'
import { User } from '../src/models/user.model'

dotenv.config()

// Permission assignments based on usePermissions.ts logic
const ROLE_PERMISSIONS: { [key: string]: string[] } = {
  مالك: [
    // All permissions
    'patients.view',
    'patients.create',
    'patients.edit',
    'patients.delete',
    'appointments.view',
    'appointments.create',
    'appointments.edit',
    'appointments.delete',
    'treatment-stages.view',
    'treatment-stages.create',
    'treatment-stages.edit',
    'treatment-stages.delete',
    'financial.view',
    'financial.edit',
    'financial-records.view',
    'financial-records.create',
    'financial-records.edit',
    'financial-records.delete',
    'invoices.view',
    'invoices.create',
    'invoices.edit',
    'invoices.delete',
    'payments.view',
    'payments.create',
    'payments.edit',
    'payments.delete',
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'sales.view',
    'sales.create',
    'sales.edit',
    'sales.delete',
    'departments.view',
    'departments.create',
    'departments.edit',
    'departments.delete',
    'services.view',
    'services.create',
    'services.edit',
    'services.delete',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'roles.view',
    'roles.create',
    'roles.edit',
    'roles.delete',
    'permissions.view',
    'permissions.create',
    'permissions.edit',
    'permissions.delete',
    'delete',
  ],
  مدير: [
    // Manager has same as Owner except roles/permissions management might be limited
    'patients.view',
    'patients.create',
    'patients.edit',
    'patients.delete',
    'appointments.view',
    'appointments.create',
    'appointments.edit',
    'appointments.delete',
    'treatment-stages.view',
    'treatment-stages.create',
    'treatment-stages.edit',
    'treatment-stages.delete',
    'financial.view',
    'financial.edit',
    'financial-records.view',
    'financial-records.create',
    'financial-records.edit',
    'financial-records.delete',
    'invoices.view',
    'invoices.create',
    'invoices.edit',
    'invoices.delete',
    'payments.view',
    'payments.create',
    'payments.edit',
    'payments.delete',
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'sales.view',
    'sales.create',
    'sales.edit',
    'sales.delete',
    'departments.view',
    'departments.create',
    'departments.edit',
    'departments.delete',
    'services.view',
    'services.create',
    'services.edit',
    'services.delete',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'delete',
  ],
  طبيب: [
    // Doctor: treatment stages, patients view, appointments view
    'patients.view',
    'appointments.view',
    'treatment-stages.view',
    'treatment-stages.create',
    'treatment-stages.edit',
    'treatment-stages.delete',
  ],
  محاسب: [
    // Accountant: financial data
    'financial.view',
    'financial.edit',
    'financial-records.view',
    'financial-records.create',
    'financial-records.edit',
    'invoices.view',
    'invoices.create',
    'invoices.edit',
    'payments.view',
    'payments.create',
    'payments.edit',
  ],
  سكرتير: [
    // Reception: patients and appointments
    'patients.view',
    'patients.create',
    'patients.edit',
    'appointments.view',
    'appointments.create',
    'appointments.edit',
  ],
}

const assignPermissionsToRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI!)
    console.log('✅ Connected to MongoDB')

    // Find first admin/owner user to use as grantedBy
    const adminUser = await User.findOne({ role: 'مالك' }).sort({ createdAt: 1 })
    if (!adminUser) {
      throw new Error(
        'No admin user found. Please create an admin user first using seedAdmin.ts'
      )
    }

    console.log(`📝 Using admin user ${adminUser.email} as grantor`)

    // Get all roles and permissions
    const roles = await Role.find({})
    const permissions = await Permission.find({})

    const roleMap = new Map(roles.map((r) => [r.name, r]))
    const permissionMap = new Map(permissions.map((p) => [p.name, p]))

    let totalAssigned = 0

    // Assign permissions to roles
    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
      const role = roleMap.get(roleName)
      if (!role) {
        console.log(`⚠️  Role "${roleName}" not found, skipping`)
        continue
      }

      console.log(`\n📋 Assigning permissions to role: ${roleName}`)

      for (const permissionName of permissionNames) {
        const permission = permissionMap.get(permissionName)
        if (!permission) {
          console.log(
            `   ⚠️  Permission "${permissionName}" not found, skipping`
          )
          continue
        }

        // Check if assignment already exists
        const existing = await RolePermission.findOne({
          role: role._id,
          permission: permission._id,
        })

        if (existing) {
          console.log(
            `   ⚠️  Permission "${permissionName}" already assigned, skipping`
          )
          continue
        }

        await RolePermission.create({
          role: role._id,
          permission: permission._id,
          grantedBy: adminUser._id,
          grantedAt: new Date(),
        })

        console.log(`   ✅ Assigned: ${permissionName}`)
        totalAssigned++
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   Assigned ${totalAssigned} permissions to roles`)
    console.log('\n✅ Permission assignment completed successfully!')
  } catch (error) {
    console.error('❌ Error assigning permissions:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  assignPermissionsToRoles()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default assignPermissionsToRoles


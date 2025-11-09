// scripts/migrateRoles.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Role } from '../src/models/role.model'
import { User } from '../src/models/user.model'

dotenv.config()

const SYSTEM_ROLES = [
  { name: 'سكرتير', description: 'سكرتير - إدارة المواعيد والمرضى' },
  { name: 'طبيب', description: 'طبيب - إدارة العلاج والمراحل العلاجية' },
  { name: 'محاسب', description: 'محاسب - إدارة الحسابات المالية' },
  { name: 'مدير', description: 'مدير - إدارة شاملة للنظام' },
  { name: 'مالك', description: 'مالك - صلاحيات كاملة على النظام' },
]

const migrateRoles = async () => {
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

    // Create roles
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
      })

      createdRoles[roleData.name] = role
      console.log(`✅ Created role: ${roleData.name}`)
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   Created/Found ${Object.keys(createdRoles).length} roles`)
    console.log('\n✅ Role migration completed successfully!')

    return createdRoles
  } catch (error) {
    console.error('❌ Error migrating roles:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  migrateRoles()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default migrateRoles


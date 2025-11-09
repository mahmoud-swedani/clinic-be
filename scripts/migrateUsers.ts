// scripts/migrateUsers.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { User } from '../src/models/user.model'
import { Role } from '../src/models/role.model'

dotenv.config()

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI!)
    console.log('✅ Connected to MongoDB')

    // Get all roles
    const roles = await Role.find({})
    const roleMap = new Map(roles.map((r) => [r.name, r]))

    // Get all users
    const users = await User.find({})
    console.log(`📝 Found ${users.length} users to migrate`)

    let updated = 0
    let skipped = 0

    // Find first admin user for createdBy
    const adminUser = await User.findOne({ role: 'مالك' }).sort({ createdAt: 1 })

    for (const user of users) {
      // Skip if roleId already exists
      if (user.roleId) {
        console.log(`⚠️  User ${user.email} already has roleId, skipping`)
        skipped++
        continue
      }

      // Find matching role
      const role = roleMap.get(user.role)
      if (!role) {
        console.log(
          `⚠️  Role "${user.role}" not found for user ${user.email}, skipping`
        )
        skipped++
        continue
      }

      // Update user with roleId and audit fields
      const updateData: any = {
        roleId: role._id,
      }

      // Set createdBy if not set and admin user exists
      if (!user.createdBy && adminUser) {
        updateData.createdBy = adminUser._id
      }

      await User.findByIdAndUpdate(user._id, updateData)

      console.log(`✅ Updated user ${user.email} with roleId: ${role.name}`)
      updated++
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   Updated: ${updated} users`)
    console.log(`   Skipped: ${skipped} users`)
    console.log('\n✅ User migration completed successfully!')
  } catch (error) {
    console.error('❌ Error migrating users:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  migrateUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default migrateUsers


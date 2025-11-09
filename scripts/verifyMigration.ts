// scripts/verifyMigration.ts
// Verification script to validate that all roles, permissions, and assignments were migrated correctly

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Role } from '../src/models/role.model'
import { Permission } from '../src/models/permission.model'
import { RolePermission } from '../src/models/rolePermission.model'
import { User } from '../src/models/user.model'

dotenv.config()

const EXPECTED_ROLES = ['سكرتير', 'طبيب', 'محاسب', 'مدير', 'مالك']
const EXPECTED_PERMISSIONS_COUNT = 39 // Based on migratePermissions.ts

const verifyMigration = async () => {
  try {
    console.log('🔍 Starting Migration Verification\n')
    console.log('='.repeat(60))

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI!)
    console.log('✅ Connected to MongoDB\n')

    let allChecksPassed = true

    // Step 1: Verify Roles
    console.log('📌 Step 1: Verifying Roles')
    console.log('-'.repeat(60))
    const roles = await Role.find({})
    const roleNames = roles.map((r) => r.name)

    for (const expectedRole of EXPECTED_ROLES) {
      if (roleNames.includes(expectedRole)) {
        console.log(`✅ Role "${expectedRole}" exists`)
      } else {
        console.log(`❌ Role "${expectedRole}" is MISSING`)
        allChecksPassed = false
      }
    }

    if (roles.length !== EXPECTED_ROLES.length) {
      console.log(
        `⚠️  Warning: Expected ${EXPECTED_ROLES.length} roles, found ${roles.length}`
      )
    }
    console.log(`\n📊 Total roles found: ${roles.length}\n`)

    // Step 2: Verify Permissions
    console.log('📌 Step 2: Verifying Permissions')
    console.log('-'.repeat(60))
    const permissions = await Permission.find({})

    if (permissions.length >= EXPECTED_PERMISSIONS_COUNT) {
      console.log(
        `✅ Found ${permissions.length} permissions (expected at least ${EXPECTED_PERMISSIONS_COUNT})`
      )
    } else {
      console.log(
        `❌ Found only ${permissions.length} permissions (expected ${EXPECTED_PERMISSIONS_COUNT})`
      )
      allChecksPassed = false
    }

    // Group permissions by category
    const permissionsByCategory: { [key: string]: number } = {}
    for (const perm of permissions) {
      permissionsByCategory[perm.category] =
        (permissionsByCategory[perm.category] || 0) + 1
    }

    console.log('\n📊 Permissions by category:')
    for (const [category, count] of Object.entries(permissionsByCategory)) {
      console.log(`   ${category}: ${count}`)
    }
    console.log('')

    // Step 3: Verify Role-Permission Assignments
    console.log('📌 Step 3: Verifying Role-Permission Assignments')
    console.log('-'.repeat(60))

    const roleMap = new Map(roles.map((r) => [r.name, r]))
    const rolePermissionCounts: { [key: string]: number } = {}

    for (const roleName of EXPECTED_ROLES) {
      const role = roleMap.get(roleName)
      if (!role) {
        console.log(`⚠️  Role "${roleName}" not found, skipping permission check`)
        continue
      }

      const assignmentCount = await RolePermission.countDocuments({
        role: role._id,
      })
      rolePermissionCounts[roleName] = assignmentCount

      if (assignmentCount > 0) {
        console.log(
          `✅ Role "${roleName}" has ${assignmentCount} permissions assigned`
        )
      } else {
        console.log(
          `❌ Role "${roleName}" has NO permissions assigned`
        )
        allChecksPassed = false
      }
    }
    console.log('')

    // Step 4: Verify Users have roleId
    console.log('📌 Step 4: Verifying Users have roleId')
    console.log('-'.repeat(60))
    const users = await User.find({})
    const usersWithRoleId = await User.countDocuments({ roleId: { $exists: true, $ne: null } })
    const usersWithoutRoleId = users.length - usersWithRoleId

    console.log(`📊 Total users: ${users.length}`)
    console.log(`✅ Users with roleId: ${usersWithRoleId}`)

    if (usersWithoutRoleId > 0) {
      console.log(`⚠️  Users without roleId: ${usersWithoutRoleId}`)
      console.log('   These users may need to be migrated.')
    }

    // Check if users have valid roleId references
    const usersWithInvalidRoleId = await User.countDocuments({
      roleId: { $exists: true, $ne: null },
      role: { $nin: EXPECTED_ROLES },
    })

    if (usersWithInvalidRoleId > 0) {
      console.log(
        `⚠️  Users with invalid role enum (may be custom roles): ${usersWithInvalidRoleId}`
      )
    }
    console.log('')

    // Step 5: Summary
    console.log('='.repeat(60))
    if (allChecksPassed && usersWithRoleId === users.length) {
      console.log('✅ All verification checks PASSED!')
      console.log('   Migration appears to be complete and correct.')
    } else {
      console.log('⚠️  Some verification checks had issues:')
      if (!allChecksPassed) {
        console.log('   - Some roles or permissions are missing')
      }
      if (usersWithoutRoleId > 0) {
        console.log(
          `   - ${usersWithoutRoleId} user(s) need roleId migration`
        )
      }
      console.log('\n   Please review the issues above and run migration if needed.')
    }
    console.log('='.repeat(60))

    // Detailed statistics
    console.log('\n📊 Detailed Statistics:')
    console.log(`   Roles: ${roles.length}/${EXPECTED_ROLES.length}`)
    console.log(`   Permissions: ${permissions.length}/${EXPECTED_PERMISSIONS_COUNT}+`)
    console.log(
      `   Role-Permission Assignments: ${Object.values(rolePermissionCounts).reduce((a, b) => a + b, 0)}`
    )
    console.log(`   Users with roleId: ${usersWithRoleId}/${users.length}`)
    console.log('')

    return {
      success: allChecksPassed && usersWithRoleId === users.length,
      stats: {
        roles: roles.length,
        permissions: permissions.length,
        assignments: Object.values(rolePermissionCounts).reduce((a, b) => a + b, 0),
        usersWithRoleId,
        totalUsers: users.length,
      },
    }
  } catch (error) {
    console.error('\n❌ Verification failed:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  verifyMigration()
    .then((result) => {
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default verifyMigration


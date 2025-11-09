// scripts/runMigration.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import migrateRoles from './migrateRoles'
import migratePermissions from './migratePermissions'
import assignPermissionsToRoles from './assignPermissionsToRoles'
import migrateUsers from './migrateUsers'

dotenv.config()

const runMigration = async () => {
  try {
    console.log('🚀 Starting Role & Permission Migration\n')
    console.log('=' .repeat(50))

    // Step 1: Migrate Roles
    console.log('\n📌 Step 1: Migrating Roles')
    console.log('-'.repeat(50))
    await migrateRoles()

    // Step 2: Migrate Permissions
    console.log('\n📌 Step 2: Migrating Permissions')
    console.log('-'.repeat(50))
    await migratePermissions()

    // Step 3: Assign Permissions to Roles
    console.log('\n📌 Step 3: Assigning Permissions to Roles')
    console.log('-'.repeat(50))
    await assignPermissionsToRoles()

    // Step 4: Migrate Users
    console.log('\n📌 Step 4: Migrating Users')
    console.log('-'.repeat(50))
    await migrateUsers()

    console.log('\n' + '='.repeat(50))
    console.log('✅ All migrations completed successfully!')
    console.log('=' .repeat(50))
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default runMigration


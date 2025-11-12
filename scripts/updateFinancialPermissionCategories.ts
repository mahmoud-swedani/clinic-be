// scripts/updateFinancialPermissionCategories.ts
// Migration script to update existing permission categories
// Splits financial category into: invoices, financial-records, payments
// This script is idempotent - safe to run multiple times

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Permission } from '../src/models/permission.model'

dotenv.config()

// Mapping of permission names to their new categories
const CATEGORY_UPDATES: { [key: string]: string } = {
  // Financial Records
  'financial-records.view': 'financial-records',
  'financial-records.create': 'financial-records',
  'financial-records.edit': 'financial-records',
  'financial-records.delete': 'financial-records',
  // Invoices
  'invoices.view': 'invoices',
  'invoices.create': 'invoices',
  'invoices.edit': 'invoices',
  'invoices.delete': 'invoices',
  // Payments
  'payments.view': 'payments',
  'payments.create': 'payments',
  'payments.edit': 'payments',
  'payments.delete': 'payments',
}

const updateFinancialPermissionCategories = async () => {
  try {
    console.log('🚀 Starting Financial Permission Category Update\n')
    console.log('='.repeat(60))

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI!)
    console.log('✅ Connected to MongoDB\n')

    // Update permissions
    console.log('📌 Updating Permission Categories')
    console.log('-'.repeat(60))

    let updatedCount = 0
    let skippedCount = 0

    for (const [permissionName, newCategory] of Object.entries(CATEGORY_UPDATES)) {
      const permission = await Permission.findOne({ name: permissionName })

      if (!permission) {
        console.log(`⚠️  Permission "${permissionName}" not found, skipping`)
        skippedCount++
        continue
      }

      // Check if already updated
      if (permission.category === newCategory) {
        console.log(`✓ Permission "${permissionName}" already has category "${newCategory}", skipping`)
        skippedCount++
        continue
      }

      // Update category
      permission.category = newCategory
      await permission.save()

      console.log(`✅ Updated "${permissionName}": "${permission.category}" → "${newCategory}"`)
      updatedCount++
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Migration completed successfully!')
    console.log('='.repeat(60))
    console.log('\n📊 Summary:')
    console.log(`   Updated: ${updatedCount}`)
    console.log(`   Skipped: ${skippedCount} (already updated or not found)`)
    console.log('\n🎉 All permission categories have been updated!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  updateFinancialPermissionCategories()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default updateFinancialPermissionCategories


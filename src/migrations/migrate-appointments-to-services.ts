/**
 * Migration Script: Convert Appointments to Multi-Service Support
 * 
 * This script migrates existing appointments from single-service to multi-service support:
 * 1. Creates AppointmentService entries for each appointment's existing service
 * 2. Migrates treatment stages to link to AppointmentService instead of Appointment
 * 
 * IMPORTANT: Run this script in a transaction or backup your database first!
 * 
 * Usage:
 *   - Test on staging first
 *   - Backup database before running
 *   - Run: npx ts-node src/migrations/migrate-appointments-to-services.ts
 */

import mongoose from 'mongoose'
import { Appointment } from '../models/appointment.model'
import { AppointmentService } from '../models/appointmentService.model'
import { TreatmentStage } from '../models/treatmentStage.model'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function migrateAppointmentsToServices() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is required')
    }

    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Start migration
    console.log('🔄 Starting migration...')

    // Step 1: Get all appointments that have a service field
    const appointments = await Appointment.find({
      service: { $exists: true, $ne: null }
    }).lean()

    console.log(`📋 Found ${appointments.length} appointments to migrate`)

    let migratedAppointments = 0
    let migratedTreatmentStages = 0
    let skippedAppointments = 0
    let errors: string[] = []

    // Step 2: Create AppointmentService entries for each appointment
    for (const appointment of appointments) {
      try {
        // Check if AppointmentService already exists for this appointment-service pair
        const existingAppointmentService = await AppointmentService.findOne({
          appointment: appointment._id,
          service: appointment.service,
        })

        if (existingAppointmentService) {
          console.log(`⏭️  AppointmentService already exists for appointment ${appointment._id}`)
          skippedAppointments++
          continue
        }

        // Create AppointmentService entry
        const appointmentService = await AppointmentService.create({
          appointment: appointment._id,
          service: appointment.service,
          order: 0, // First service gets order 0
        })

        console.log(`✅ Created AppointmentService for appointment ${appointment._id}`)
        migratedAppointments++

        // Step 3: Migrate treatment stages linked to this appointment
        const treatmentStages = await TreatmentStage.find({
          appointment: appointment._id,
          appointmentService: { $exists: false }, // Only migrate stages not already migrated
        })

        for (const stage of treatmentStages) {
          try {
            await TreatmentStage.updateOne(
              { _id: stage._id },
              {
                $set: {
                  appointmentService: appointmentService._id,
                },
              }
            )
            migratedTreatmentStages++
            console.log(`  ✅ Migrated treatment stage ${stage._id}`)
          } catch (error: any) {
            const errorMsg = `Failed to migrate treatment stage ${stage._id}: ${error.message}`
            console.error(`  ❌ ${errorMsg}`)
            errors.push(errorMsg)
          }
        }
      } catch (error: any) {
        const errorMsg = `Failed to migrate appointment ${appointment._id}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    // Step 4: Handle orphaned treatment stages (stages with appointment but no AppointmentService)
    const orphanedStages = await TreatmentStage.find({
      appointment: { $exists: true, $ne: null },
      appointmentService: { $exists: false },
    }).lean()

    console.log(`\n🔍 Found ${orphanedStages.length} orphaned treatment stages`)

    for (const stage of orphanedStages) {
      try {
        // Try to find or create AppointmentService for this appointment
        const appointment = await Appointment.findById(stage.appointment).lean()
        
        if (!appointment || !appointment.service) {
          console.log(`⚠️  Skipping orphaned stage ${stage._id} - appointment or service not found`)
          continue
        }

        // Find or create AppointmentService
        let appointmentService = await AppointmentService.findOne({
          appointment: appointment._id,
          service: appointment.service,
        })

        if (!appointmentService) {
          appointmentService = await AppointmentService.create({
            appointment: appointment._id,
            service: appointment.service,
            order: 0,
          })
          console.log(`  ✅ Created missing AppointmentService for appointment ${appointment._id}`)
        }

        // Update the treatment stage
        await TreatmentStage.updateOne(
          { _id: stage._id },
          {
            $set: {
              appointmentService: appointmentService._id,
            },
          }
        )
        migratedTreatmentStages++
        console.log(`  ✅ Migrated orphaned treatment stage ${stage._id}`)
      } catch (error: any) {
        const errorMsg = `Failed to migrate orphaned stage ${stage._id}: ${error.message}`
        console.error(`  ❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    // Summary
    console.log('\n📊 Migration Summary:')
    console.log(`  ✅ Migrated appointments: ${migratedAppointments}`)
    console.log(`  ⏭️  Skipped appointments: ${skippedAppointments}`)
    console.log(`  ✅ Migrated treatment stages: ${migratedTreatmentStages}`)
    console.log(`  ❌ Errors: ${errors.length}`)

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }

    console.log('\n✅ Migration completed!')
  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateAppointmentsToServices()
    .then(() => {
      console.log('🎉 Migration script finished successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error)
      process.exit(1)
    })
}

export default migrateAppointmentsToServices


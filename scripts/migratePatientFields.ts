// scripts/migratePatientFields.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

// Import Patient model
import { Patient } from '../src/models/patient.model'

async function migratePatientFields() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables')
    }

    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Find all patients
    const patients = await Patient.find({}).lean()
    console.log(`📋 Found ${patients.length} patients to migrate`)

    let migratedCount = 0
    let refNumberCount = 0

    for (const patient of patients) {
      const updates: any = {}

      // Generate refNumber if not exists
      if (!patient.refNumber) {
        // Find the highest refNumber
        const lastPatient = await Patient.findOne({ refNumber: { $exists: true } })
          .sort({ refNumber: -1 })
          .lean()

        let nextNumber = 1
        if (lastPatient?.refNumber) {
          const match = lastPatient.refNumber.match(/PAT-(\d+)/)
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1
          }
        }

        updates.refNumber = `PAT-${String(nextNumber).padStart(3, '0')}`
        refNumberCount++
      }

      // Split fullName into firstName, fatherName, lastName if not exists
      if (!patient.firstName && !patient.fatherName && !patient.lastName && patient.fullName) {
        const nameParts = patient.fullName.trim().split(/\s+/)
        if (nameParts.length >= 3) {
          updates.firstName = nameParts[0]
          updates.fatherName = nameParts[1]
          updates.lastName = nameParts.slice(2).join(' ')
        } else if (nameParts.length === 2) {
          updates.firstName = nameParts[0]
          updates.fatherName = nameParts[1]
          updates.lastName = ''
        } else if (nameParts.length === 1) {
          updates.firstName = nameParts[0]
          updates.fatherName = ''
          updates.lastName = ''
        }
      }

      // Set default values for new fields
      if (!patient.nationality) {
        updates.nationality = 'سوري'
      }

      if (!patient.patientClassification) {
        updates.patientClassification = 'new'
      }

      if (!patient.dateFileOpening && patient.createdAt) {
        updates.dateFileOpening = patient.createdAt
      }

      // Convert old address string to address object
      if (typeof patient.address === 'string' && patient.address.trim()) {
        updates.address = {
          street: patient.address,
          city: '',
          region: '',
        }
      }

      // Migrate old medicalHistory to currentMedicalHistory if needed
      if (patient.medicalHistory && !patient.currentMedicalHistory) {
        updates.currentMedicalHistory = patient.medicalHistory
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await Patient.findByIdAndUpdate(patient._id, updates)
        migratedCount++
        console.log(`✅ Migrated patient: ${patient.fullName || patient._id}`)
      }
    }

    console.log(`\n✅ Migration completed!`)
    console.log(`   - Total patients processed: ${patients.length}`)
    console.log(`   - Patients migrated: ${migratedCount}`)
    console.log(`   - RefNumbers generated: ${refNumberCount}`)

    await mongoose.disconnect()
    console.log('✅ Disconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration error:', error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

// Run migration
migratePatientFields()


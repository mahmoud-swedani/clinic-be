// src/models/patientMedication.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IPatientMedication extends Document {
  patient: mongoose.Types.ObjectId
  medicationName: string
  dosage?: string
  frequency?: string
  startDate?: Date
  endDate?: Date
  results?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const patientMedicationSchema = new Schema<IPatientMedication>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    medicationName: { type: String, required: true },
    dosage: { type: String },
    frequency: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    results: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
)

// Database indexes
patientMedicationSchema.index({ patient: 1 })
patientMedicationSchema.index({ startDate: -1 })
patientMedicationSchema.index({ createdAt: -1 })

export const PatientMedication = mongoose.model<IPatientMedication>(
  'PatientMedication',
  patientMedicationSchema
)


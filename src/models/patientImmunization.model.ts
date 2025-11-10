// src/models/patientImmunization.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IPatientImmunization extends Document {
  patient: mongoose.Types.ObjectId
  vaccineName: string
  date: Date
  batchNumber?: string
  nextDueDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const patientImmunizationSchema = new Schema<IPatientImmunization>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    vaccineName: { type: String, required: true },
    date: { type: Date, required: true },
    batchNumber: { type: String },
    nextDueDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
)

// Database indexes
patientImmunizationSchema.index({ patient: 1 })
patientImmunizationSchema.index({ date: -1 })
patientImmunizationSchema.index({ createdAt: -1 })

export const PatientImmunization = mongoose.model<IPatientImmunization>(
  'PatientImmunization',
  patientImmunizationSchema
)


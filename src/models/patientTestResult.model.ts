// src/models/patientTestResult.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IPatientTestResult extends Document {
  patient: mongoose.Types.ObjectId
  testName: string
  testDate: Date
  results: string
  doctor?: mongoose.Types.ObjectId
  notes?: string
  attachments?: string[]
  createdAt: Date
  updatedAt: Date
}

const patientTestResultSchema = new Schema<IPatientTestResult>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    testName: { type: String, required: true },
    testDate: { type: Date, required: true },
    results: { type: String, required: true },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: { type: String },
    attachments: [{ type: String }],
  },
  { timestamps: true }
)

// Database indexes
patientTestResultSchema.index({ patient: 1 })
patientTestResultSchema.index({ testDate: -1 })
patientTestResultSchema.index({ createdAt: -1 })

export const PatientTestResult = mongoose.model<IPatientTestResult>(
  'PatientTestResult',
  patientTestResultSchema
)


// src/models/patient.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IPatient extends Document {
  fullName: string
  phone: string
  gender: 'male' | 'female'
  dateOfBirth?: Date
  address?: string
  medicalHistory?: string
  createdAt: Date
  updatedAt: Date
}

const patientSchema = new Schema<IPatient>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    dateOfBirth: { type: Date },
    address: { type: String },
    medicalHistory: { type: String },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
patientSchema.index({ phone: 1 })
patientSchema.index({ fullName: 'text' }) // For text search
patientSchema.index({ createdAt: -1 })

export const Patient = mongoose.model<IPatient>('Patient', patientSchema)

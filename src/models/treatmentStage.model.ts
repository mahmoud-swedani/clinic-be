// src/models/treatmentStage.model.ts

import mongoose, { Schema, Document } from 'mongoose'

export interface ITreatmentStage extends Document {
  client: mongoose.Types.ObjectId
  title: string
  description?: string
  date: Date
  doctor?: mongoose.Types.ObjectId
  appointment?: mongoose.Types.ObjectId // Deprecated: kept for backward compatibility during migration
  appointmentService?: mongoose.Types.ObjectId // New: link to AppointmentService
  cost?: number
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

const treatmentStageSchema = new Schema<ITreatmentStage>(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    }, // Deprecated: kept for backward compatibility
    appointmentService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppointmentService',
    },
    cost: { type: Number },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
treatmentStageSchema.index({ client: 1, date: -1 })
treatmentStageSchema.index({ doctor: 1 })
treatmentStageSchema.index({ isCompleted: 1 })
treatmentStageSchema.index({ createdAt: -1 })
treatmentStageSchema.index({ appointmentService: 1 })

export const TreatmentStage = mongoose.model<ITreatmentStage>(
  'TreatmentStage',
  treatmentStageSchema
)

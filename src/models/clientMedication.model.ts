// src/models/clientMedication.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IClientMedication extends Document {
  client: mongoose.Types.ObjectId
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

const clientMedicationSchema = new Schema<IClientMedication>(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
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
clientMedicationSchema.index({ client: 1 })
clientMedicationSchema.index({ startDate: -1 })
clientMedicationSchema.index({ createdAt: -1 })

export const ClientMedication = mongoose.model<IClientMedication>(
  'ClientMedication',
  clientMedicationSchema
)


// src/models/clientImmunization.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IClientImmunization extends Document {
  client: mongoose.Types.ObjectId
  vaccineName: string
  date: Date
  batchNumber?: string
  nextDueDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const clientImmunizationSchema = new Schema<IClientImmunization>(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
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
clientImmunizationSchema.index({ client: 1 })
clientImmunizationSchema.index({ date: -1 })
clientImmunizationSchema.index({ createdAt: -1 })

export const ClientImmunization = mongoose.model<IClientImmunization>(
  'ClientImmunization',
  clientImmunizationSchema
)


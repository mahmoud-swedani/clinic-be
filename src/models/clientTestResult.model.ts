// src/models/clientTestResult.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IClientTestResult extends Document {
  client: mongoose.Types.ObjectId
  testName: string
  testDate: Date
  results: string
  doctor?: mongoose.Types.ObjectId
  notes?: string
  attachments?: string[]
  createdAt: Date
  updatedAt: Date
}

const clientTestResultSchema = new Schema<IClientTestResult>(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
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
clientTestResultSchema.index({ client: 1 })
clientTestResultSchema.index({ testDate: -1 })
clientTestResultSchema.index({ createdAt: -1 })

export const ClientTestResult = mongoose.model<IClientTestResult>(
  'ClientTestResult',
  clientTestResultSchema
)


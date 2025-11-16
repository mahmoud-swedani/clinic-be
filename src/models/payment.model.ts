// src/models/payment.model.ts

import mongoose, { Schema, Document } from 'mongoose'

export interface IPayment extends Document {
  client: mongoose.Types.ObjectId
  appointment?: mongoose.Types.ObjectId
  invoice: mongoose.Types.ObjectId
  treatmentStages?: mongoose.Types.ObjectId[] // Optional: specific treatment stages this payment is for
  amount: number
  method: 'نقدًا' | 'بطاقة' | 'تحويل بنكي' | 'أخرى'
  notes?: string // Optional notes for the payment
  date: Date
  receivedBy: mongoose.Types.ObjectId // المحاسب
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    treatmentStages: [{ type: Schema.Types.ObjectId, ref: 'TreatmentStage' }], // Optional: specific treatment stages
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ['نقدًا', 'بطاقة', 'تحويل بنكي', 'أخرى'],
      required: true,
    },
    notes: { type: String }, // Optional notes for the payment
    date: { type: Date, default: Date.now },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
paymentSchema.index({ invoice: 1 })
paymentSchema.index({ client: 1, date: -1 })
paymentSchema.index({ date: -1 })
paymentSchema.index({ createdAt: -1 })

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema)

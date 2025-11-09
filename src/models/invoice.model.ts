// src/models/invoice.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IInvoice extends Document {
  patient: mongoose.Types.ObjectId
  appointment: mongoose.Types.ObjectId
  treatmentStages: mongoose.Types.ObjectId[]
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: 'غير مدفوعة' | 'مدفوعة جزئيًا' | 'مدفوعة بالكامل' | 'دين معدوم'
  createdBy: mongoose.Types.ObjectId // المحاسب الذي أنشأ الفاتورة
  createdAt: Date
  updatedAt: Date
}

const invoiceSchema = new Schema<IInvoice>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    treatmentStages: [{ type: Schema.Types.ObjectId, ref: 'TreatmentStage' }],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['غير مدفوعة', 'مدفوعة جزئيًا', 'مدفوعة بالكامل', 'دين معدوم'],
      default: 'غير مدفوعة',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
invoiceSchema.index({ status: 1 })
invoiceSchema.index({ patient: 1, createdAt: -1 })
invoiceSchema.index({ createdAt: -1 })

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema)

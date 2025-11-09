// src/models/financialRecord.model.ts

import mongoose, { Schema, Document } from 'mongoose'

export interface IPayment {
  amount: number
  paymentDate: Date
  method: 'cash' | 'check' | 'transfer' | 'other'
  notes?: string
}

export interface IFinancialRecord extends Document {
  recordType: 'purchase' | 'expense' | 'salary'
  invoiceNumber?: string
  supplierName?: string
  description?: string
  recordDate: Date
  totalAmount: number
  status: 'paid' | 'partial' | 'unpaid'
  payments: IPayment[]
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new Schema<IPayment>(
  {
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    method: {
      type: String,
      enum: ['cash', 'check', 'transfer', 'other'],
      required: true,
    },
    notes: { type: String },
  },
  { _id: false }
)

const financialRecordSchema = new Schema<IFinancialRecord>(
  {
    recordType: {
      type: String,
      enum: ['purchase', 'expense', 'salary'],
      required: true,
    },
    invoiceNumber: { type: String, unique: true, sparse: true }, // فقط للمشتريات
    supplierName: { type: String }, // فقط للمشتريات
    description: { type: String }, // فقط للمصاريف
    recordDate: { type: Date, required: true, default: Date.now },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'unpaid',
      required: true,
    },
    payments: [paymentSchema],
  },
  { timestamps: true }
)

// Database indexes for performance optimization
financialRecordSchema.index({ recordType: 1, status: 1 })
financialRecordSchema.index({ recordDate: -1 })
financialRecordSchema.index({ createdAt: -1 })

export const FinancialRecord = mongoose.model<IFinancialRecord>(
  'FinancialRecord',
  financialRecordSchema
)

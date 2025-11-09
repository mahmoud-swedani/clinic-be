import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ISalePayment extends Document {
  sale: Types.ObjectId
  amount: number
  createdAt: Date
  createdBy?: Types.ObjectId
  notes?: string
}

const salePaymentSchema = new Schema<ISalePayment>(
  {
    sale: { type: Schema.Types.ObjectId, ref: 'Sale', required: true },
    amount: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

export const SalePayment =
  mongoose.models.SalePayment ||
  mongoose.model<ISalePayment>('SalePayment', salePaymentSchema)

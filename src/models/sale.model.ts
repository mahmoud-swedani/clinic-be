import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ISaleItem {
  product: Types.ObjectId // إشارة للمنتج
  quantity: number
  unitPrice: number
}

export interface ISale extends Document {
  patient: Types.ObjectId // إشارة للمريض
  items: ISaleItem[]
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: 'paid' | 'partial' | 'unpaid'
  paymentMethod: 'cash' | 'card' | 'insurance' | 'other'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
)

const saleSchema = new Schema<ISale>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    items: [saleItemSchema],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'insurance', 'other'],
      default: 'cash',
    },
    notes: { type: String },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
saleSchema.index({ patient: 1, createdAt: -1 })
saleSchema.index({ paymentStatus: 1 })
saleSchema.index({ createdAt: -1 })

export const Sale =
  mongoose.models.Sale || mongoose.model<ISale>('Sale', saleSchema)

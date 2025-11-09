// src/models/product.model.ts
import mongoose, { Document, Model, model, Schema } from 'mongoose'

export interface IProduct extends Document {
  name: string
  category?: string
  unit: 'قطعة' | 'كغم' | 'لتر' | 'علبة' | 'أخرى'
  purchasePrice: number
  sellingPrice?: number
  stock: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      enum: ['قطعة', 'كغم', 'لتر', 'علبة', 'أخرى'],
      default: 'قطعة',
    },
    purchasePrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
    },
    stock: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
productSchema.index({ name: 1 })
productSchema.index({ category: 1 })
productSchema.index({ stock: 1 }) // For low stock queries

const Product: Model<IProduct> =
  mongoose.models.Product || model<IProduct>('Product', productSchema)

export default Product

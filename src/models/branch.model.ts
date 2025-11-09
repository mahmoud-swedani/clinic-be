// models/branch.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IBranch extends Document {
  name: string
  location?: string
  phone?: string
  isActive: boolean
}

const branchSchema = new Schema<IBranch>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    location: {
      type: String,
    },
    phone: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export const Branch = mongoose.model<IBranch>('Branch', branchSchema)

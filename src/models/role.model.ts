// src/models/role.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IRole extends Document {
  name: string
  description?: string
  isSystemRole: boolean
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
// Note: name index is already created by unique: true
roleSchema.index({ isSystemRole: 1 })
roleSchema.index({ createdAt: -1 })

export const Role = mongoose.model<IRole>('Role', roleSchema)


// src/models/permission.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IPermission extends Document {
  name: string
  description?: string
  category: string
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const permissionSchema = new Schema<IPermission>(
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
    category: {
      type: String,
      required: true,
      trim: true,
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
permissionSchema.index({ category: 1 })
permissionSchema.index({ createdAt: -1 })

export const Permission = mongoose.model<IPermission>('Permission', permissionSchema)


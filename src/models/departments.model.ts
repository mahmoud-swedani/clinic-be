import mongoose, { Schema, Document } from 'mongoose'

export interface IDepartment extends Document {
  name: string
  description?: string
  branch: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true },
    description: { type: String },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
departmentSchema.index({ branch: 1 })

export const Department = mongoose.model<IDepartment>(
  'Department',
  departmentSchema
)

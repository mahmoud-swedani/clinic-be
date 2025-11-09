import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IService extends Document {
  departmentId: Types.ObjectId
  name: string
  description?: string
  price: number
  duration: number // بالدقائق
  image?: string
  isActive: boolean
  requiresConsultation: boolean
  createdAt: Date
  updatedAt: Date
}

const ServiceSchema: Schema = new Schema(
  {
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // مدة الخدمة بالدقائق
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    requiresConsultation: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

// Database indexes for performance optimization
ServiceSchema.index({ departmentId: 1, isActive: 1 })
ServiceSchema.index({ isActive: 1 })

const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema)

export default Service

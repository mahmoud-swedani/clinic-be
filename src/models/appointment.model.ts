import mongoose, { Schema } from 'mongoose'

export interface IAppointment {
  client: mongoose.Types.ObjectId
  doctor: mongoose.Types.ObjectId
  date: Date
  type: string
  status: 'محجوز' | 'نشط' | 'تم' | 'ملغي'
  notes?: string
  service: mongoose.Types.ObjectId
  departmentId: mongoose.Types.ObjectId
}

const appointmentSchema = new Schema<IAppointment>(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['محجوز', 'نشط', 'تم', 'ملغي'],
      default: 'محجوز',
    },
    type: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
appointmentSchema.index({ date: 1, status: 1 })
appointmentSchema.index({ client: 1, date: -1 })
appointmentSchema.index({ doctor: 1, date: -1 })
appointmentSchema.index({ createdAt: -1 })

export const Appointment = mongoose.model<IAppointment>(
  'Appointment',
  appointmentSchema
)

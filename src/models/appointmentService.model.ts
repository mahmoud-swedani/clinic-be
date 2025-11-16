import mongoose, { Schema, Document } from 'mongoose'

export interface IAppointmentService extends Document {
  appointment: mongoose.Types.ObjectId
  service: mongoose.Types.ObjectId
  order?: number
  createdAt: Date
  updatedAt: Date
}

const appointmentServiceSchema = new Schema<IAppointmentService>(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

// Database indexes for performance optimization
appointmentServiceSchema.index({ appointment: 1 })
appointmentServiceSchema.index({ service: 1 })
appointmentServiceSchema.index({ appointment: 1, service: 1 }, { unique: true })
appointmentServiceSchema.index({ appointment: 1, order: 1 })

export const AppointmentService = mongoose.model<IAppointmentService>(
  'AppointmentService',
  appointmentServiceSchema
)


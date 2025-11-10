// src/models/patient.model.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IAddress {
  city?: string
  region?: string
  street?: string
}

export interface IEmergencyContact {
  name?: string
  phone?: string
  relationship?: string
}

export interface ILifestyle {
  smoking?: string
  alcohol?: string
  physicalActivity?: string
  diet?: string
}

export interface IBaselineVitals {
  bloodPressure?: string
  bloodSugar?: string
  weight?: number
  height?: number
}

export interface IPatient extends Document {
  refNumber: string
  firstName: string
  fatherName: string
  lastName: string
  fullName: string
  phone: string
  gender: 'male' | 'female'
  dateOfBirth?: Date
  nationalId?: string
  idNumber?: string
  passportNumber?: string
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'
  nationality: string
  email?: string
  address?: IAddress
  emergencyContact?: IEmergencyContact
  primaryReasonForVisit?: string
  currentMedicalHistory?: string
  allergies?: string[]
  chronicDiseases?: string[]
  previousSurgeries?: string[]
  currentMedications?: string[]
  familyHistory?: string
  dateFileOpening: Date
  lifestyle?: ILifestyle
  bmi?: number
  baselineVitals?: IBaselineVitals
  appointmentAdherence?: string
  improvementNotes?: string
  patientClassification: 'regular' | 'new' | 'chronic' | 'VIP'
  createdAt: Date
  updatedAt: Date
}

const addressSchema = new Schema<IAddress>(
  {
    city: { type: String },
    region: { type: String },
    street: { type: String },
  },
  { _id: false }
)

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String },
  },
  { _id: false }
)

const lifestyleSchema = new Schema<ILifestyle>(
  {
    smoking: { type: String },
    alcohol: { type: String },
    physicalActivity: { type: String },
    diet: { type: String },
  },
  { _id: false }
)

const baselineVitalsSchema = new Schema<IBaselineVitals>(
  {
    bloodPressure: { type: String },
    bloodSugar: { type: String },
    weight: { type: Number },
    height: { type: Number },
  },
  { _id: false }
)

const patientSchema = new Schema<IPatient>(
  {
    refNumber: { type: String, unique: true, sparse: true },
    firstName: { type: String, required: true },
    fatherName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    dateOfBirth: { type: Date },
    nationalId: { type: String },
    idNumber: { type: String },
    passportNumber: { type: String },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed'],
    },
    nationality: { type: String, default: 'سوري' },
    email: { type: String },
    address: { type: addressSchema },
    emergencyContact: { type: emergencyContactSchema },
    primaryReasonForVisit: { type: String },
    currentMedicalHistory: { type: String },
    allergies: [{ type: String }],
    chronicDiseases: [{ type: String }],
    previousSurgeries: [{ type: String }],
    currentMedications: [{ type: String }],
    familyHistory: { type: String },
    dateFileOpening: { type: Date, default: Date.now },
    lifestyle: { type: lifestyleSchema },
    bmi: { type: Number },
    baselineVitals: { type: baselineVitalsSchema },
    appointmentAdherence: { type: String },
    improvementNotes: { type: String },
    patientClassification: {
      type: String,
      enum: ['regular', 'new', 'chronic', 'VIP'],
      default: 'new',
    },
  },
  { timestamps: true }
)

// Pre-save hook to auto-generate refNumber
patientSchema.pre('save', async function (next) {
  if (!this.refNumber) {
    try {
      // Find the highest refNumber
      const lastPatient = (await mongoose
        .model('Patient')
        .findOne({ refNumber: { $exists: true } })
        .sort({ refNumber: -1 })
        .lean()
        .exec()) as unknown as IPatient | null

      let nextNumber = 1
      if (lastPatient?.refNumber) {
        // Extract number from PAT-XXX format
        const match = lastPatient.refNumber.match(/PAT-(\d+)/)
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1
        }
      }

      // Format as PAT-001, PAT-002, etc.
      this.refNumber = `PAT-${String(nextNumber).padStart(3, '0')}`
    } catch (error) {
      return next(error as Error)
    }
  }

  // Auto-generate fullName from name components
  if (this.firstName && this.fatherName && this.lastName) {
    this.fullName = `${this.firstName} ${this.fatherName} ${this.lastName}`.trim()
  }

  next()
})

// Database indexes for performance optimization
patientSchema.index({ phone: 1 })
patientSchema.index({ fullName: 'text' }) // For text search
patientSchema.index({ createdAt: -1 })
patientSchema.index({ refNumber: 1 })
patientSchema.index({ email: 1 })
patientSchema.index({ nationalId: 1 })

export const Patient = mongoose.model<IPatient>('Patient', patientSchema)

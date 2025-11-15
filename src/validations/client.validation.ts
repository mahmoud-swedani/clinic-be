import { z } from 'zod'

const addressSchema = z.object({
  city: z.string().optional(),
  region: z.string().optional(),
  street: z.string().optional(),
})

const emergencyContactSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  relationship: z.string().optional(),
})

const lifestyleSchema = z.object({
  smoking: z.string().optional(),
  alcohol: z.string().optional(),
  physicalActivity: z.string().optional(),
  diet: z.string().optional(),
})

const baselineVitalsSchema = z.object({
  bloodPressure: z.string().optional(),
  bloodSugar: z.string().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
})

export const createClientSchema = z.object({
  refNumber: z.string().optional(),
  firstName: z.string().min(1, 'الاسم الأول مطلوب'),
  fatherName: z.string().min(1, 'اسم الأب مطلوب'),
  lastName: z.string().min(1, 'اسم العائلة مطلوب'),
  fullName: z.string().optional(), // Auto-generated, optional in input
  phone: z.string().min(8, 'رقم الهاتف غير صالح'),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string().or(z.date()).optional(),
  nationalId: z.string().optional(),
  idNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  nationality: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  address: addressSchema.optional().or(z.string().optional()), // Support both old string and new object
  emergencyContact: emergencyContactSchema.optional(),
  primaryReasonForVisit: z.string().optional(),
  currentMedicalHistory: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicDiseases: z.array(z.string()).optional(),
  previousSurgeries: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  familyHistory: z.string().optional(),
  dateFileOpening: z.string().or(z.date()).optional(),
  lifestyle: lifestyleSchema.optional(),
  bmi: z.number().optional(),
  baselineVitals: baselineVitalsSchema.optional(),
  appointmentAdherence: z.string().optional(),
  improvementNotes: z.string().optional(),
  clientClassification: z.enum(['regular', 'new', 'chronic', 'VIP']).optional(),
  // Keep old fields for backward compatibility
  medicalHistory: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()


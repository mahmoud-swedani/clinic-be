import { Patient } from '../models/patient.model'
import { Appointment } from '../models/appointment.model'

export class PatientService {
  /**
   * Create a new patient
   */
  static async createPatient(patientData: any) {
    const patient = new Patient(patientData)
    await patient.save()
    return patient
  }

  /**
   * Get all patients with pagination
   */
  static async getAllPatients(page: number, limit: number) {
    const skip = (page - 1) * limit
    
    const [patients, total] = await Promise.all([
      Patient.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Patient.countDocuments(),
    ])

    return { patients, total }
  }

  /**
   * Get patient by ID
   */
  static async getPatientById(id: string) {
    const patient = await Patient.findById(id).lean()
    return patient
  }

  /**
   * Get patient with appointments
   */
  static async getPatientWithAppointments(id: string) {
    const patient = await Patient.findById(id).lean()
    if (!patient) {
      return null
    }

    const appointments = await Appointment.find({ patient: patient._id })
      .sort({ date: -1 })
      .lean()

    return { patient, appointments }
  }

  /**
   * Update patient by ID
   */
  static async updatePatient(id: string, updateData: any) {
    const patient = await Patient.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean()
    return patient
  }

  /**
   * Delete patient by ID
   */
  static async deletePatient(id: string) {
    const deleted = await Patient.findByIdAndDelete(id)
    return deleted
  }
}


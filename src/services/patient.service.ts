import { Patient } from '../models/patient.model'
import { Appointment } from '../models/appointment.model'
import { PatientMedication } from '../models/patientMedication.model'
import { PatientImmunization } from '../models/patientImmunization.model'
import { PatientTestResult } from '../models/patientTestResult.model'

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
    // Get the old patient data before updating
    const oldPatient = await Patient.findById(id).lean()
    
    const patient = await Patient.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean()
    
    return { updated: patient, oldPatient }
  }

  /**
   * Delete patient by ID
   */
  static async deletePatient(id: string) {
    // Get the patient data before deleting
    const patient = await Patient.findById(id).lean()
    const deleted = await Patient.findByIdAndDelete(id)
    return { deleted, patient }
  }

  /**
   * Get patient medications
   */
  static async getPatientMedications(patientId: string) {
    return PatientMedication.find({ patient: patientId })
      .sort({ startDate: -1 })
      .lean()
  }

  /**
   * Get patient immunizations
   */
  static async getPatientImmunizations(patientId: string) {
    return PatientImmunization.find({ patient: patientId })
      .sort({ date: -1 })
      .lean()
  }

  /**
   * Get patient test results
   */
  static async getPatientTestResults(patientId: string) {
    return PatientTestResult.find({ patient: patientId })
      .populate('doctor', 'name')
      .sort({ testDate: -1 })
      .lean()
  }

  /**
   * Get patient with all related records
   */
  static async getPatientWithRecords(id: string) {
    const patient = await Patient.findById(id).lean()
    if (!patient) {
      return null
    }

    const [medications, immunizations, testResults, appointments] = await Promise.all([
      this.getPatientMedications(id),
      this.getPatientImmunizations(id),
      this.getPatientTestResults(id),
      Appointment.find({ patient: id }).sort({ date: -1 }).lean(),
    ])

    return {
      patient,
      medications,
      immunizations,
      testResults,
      appointments,
    }
  }
}


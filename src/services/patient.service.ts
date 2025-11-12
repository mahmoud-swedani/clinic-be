import { Patient } from '../models/patient.model'
import { Appointment } from '../models/appointment.model'
import { PatientMedication } from '../models/patientMedication.model'
import { PatientImmunization } from '../models/patientImmunization.model'
import { PatientTestResult } from '../models/patientTestResult.model'
import { getUserRoleName } from './roleLookup.service'
import mongoose from 'mongoose'

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
   * Filters by doctor if user role is 'طبيب' - only shows patients with appointments with that doctor
   */
  static async getAllPatients(
    page: number,
    limit: number,
    user?: any,
    userId?: string
  ) {
    const skip = (page - 1) * limit
    const userRoleName = user ? getUserRoleName(user) : null

    if (userRoleName === 'طبيب' && userId) {
      // For doctors: only show patients who have appointments with this doctor
      // Get distinct patient IDs from appointments where doctor = userId
      const patientIds = await Appointment.distinct('patient', {
        doctor: userId,
      })

      if (patientIds.length === 0) {
        // No patients found for this doctor
        return { patients: [], total: 0 }
      }

      const [patients, total] = await Promise.all([
        Patient.find({ _id: { $in: patientIds } })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Patient.countDocuments({ _id: { $in: patientIds } }),
      ])

      return { patients, total }
    } else {
      // No filter for non-doctors (admins, managers, etc.)
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
  }

  /**
   * Get patient by ID
   * For doctors: verifies that the patient has appointments with the doctor
   */
  static async getPatientById(
    id: string,
    user?: any,
    userId?: string
  ) {
    const patient = await Patient.findById(id).lean()
    if (!patient) {
      return null
    }

    const userRoleName = user ? getUserRoleName(user) : null

    // If user is a doctor, verify they have appointments with this patient
    if (userRoleName === 'طبيب' && userId) {
      const hasAppointment = await Appointment.findOne({
        patient: id,
        doctor: userId,
      }).lean()

      if (!hasAppointment) {
        // Doctor doesn't have any appointments with this patient
        return null
      }
    }

    return patient
  }

  /**
   * Get patient with appointments
   * For doctors: only returns if patient has appointments with the doctor, and filters appointments
   */
  static async getPatientWithAppointments(
    id: string,
    user?: any,
    userId?: string
  ) {
    const patient = await Patient.findById(id).lean()
    if (!patient) {
      return null
    }

    const userRoleName = user ? getUserRoleName(user) : null

    // Build appointment filter
    const appointmentFilter: any = { patient: patient._id }

    // If user is a doctor, filter appointments to only those with this doctor
    if (userRoleName === 'طبيب' && userId) {
      appointmentFilter.doctor = userId

      // Verify doctor has at least one appointment with this patient
      const hasAppointment = await Appointment.findOne({
        patient: id,
        doctor: userId,
      }).lean()

      if (!hasAppointment) {
        // Doctor doesn't have any appointments with this patient
        return null
      }
    }

    const appointments = await Appointment.find(appointmentFilter)
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


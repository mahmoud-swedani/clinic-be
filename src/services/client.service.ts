import { Client } from '../models/client.model'
import { Appointment } from '../models/appointment.model'
import { ClientMedication } from '../models/clientMedication.model'
import { ClientImmunization } from '../models/clientImmunization.model'
import { ClientTestResult } from '../models/clientTestResult.model'
import { getUserRoleName } from './roleLookup.service'
import mongoose from 'mongoose'

export class ClientService {
  /**
   * Create a new client
   */
  static async createClient(clientData: any) {
    const client = new Client(clientData)
    await client.save()
    return client
  }

  /**
   * Get all clients with pagination
   * Filters by doctor if user role is 'طبيب' - only shows clients with appointments with that doctor
   */
  static async getAllClients(
    page: number,
    limit: number,
    user?: any,
    userId?: string
  ) {
    const skip = (page - 1) * limit
    const userRoleName = user ? getUserRoleName(user) : null

    if (userRoleName === 'طبيب' && userId) {
      // For doctors: only show clients who have appointments with this doctor
      // Get distinct client IDs from appointments where doctor = userId
      const clientIds = await Appointment.distinct('client', {
        doctor: userId,
      })

      if (clientIds.length === 0) {
        // No clients found for this doctor
        return { clients: [], total: 0 }
      }

      const [clients, total] = await Promise.all([
        Client.find({ _id: { $in: clientIds } })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Client.countDocuments({ _id: { $in: clientIds } }),
      ])

      return { clients, total }
    } else {
      // No filter for non-doctors (admins, managers, etc.)
      const [clients, total] = await Promise.all([
        Client.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Client.countDocuments(),
      ])

      return { clients, total }
    }
  }

  /**
   * Get client by ID
   * For doctors: verifies that the client has appointments with the doctor
   */
  static async getClientById(
    id: string,
    user?: any,
    userId?: string
  ) {
    const client = await Client.findById(id).lean()
    if (!client) {
      return null
    }

    const userRoleName = user ? getUserRoleName(user) : null

    // If user is a doctor, verify they have appointments with this client
    if (userRoleName === 'طبيب' && userId) {
      const hasAppointment = await Appointment.findOne({
        client: id,
        doctor: userId,
      }).lean()

      if (!hasAppointment) {
        // Doctor doesn't have any appointments with this client
        return null
      }
    }

    return client
  }

  /**
   * Get client with appointments
   * For doctors: only returns if client has appointments with the doctor, and filters appointments
   */
  static async getClientWithAppointments(
    id: string,
    user?: any,
    userId?: string
  ) {
    const client = await Client.findById(id).lean()
    if (!client) {
      return null
    }

    const userRoleName = user ? getUserRoleName(user) : null

    // Build appointment filter
    const appointmentFilter: any = { client: client._id }

    // If user is a doctor, filter appointments to only those with this doctor
    if (userRoleName === 'طبيب' && userId) {
      appointmentFilter.doctor = userId

      // Verify doctor has at least one appointment with this client
      const hasAppointment = await Appointment.findOne({
        client: id,
        doctor: userId,
      }).lean()

      if (!hasAppointment) {
        // Doctor doesn't have any appointments with this client
        return null
      }
    }

    const appointments = await Appointment.find(appointmentFilter)
      .sort({ date: -1 })
      .lean()

    return { client, appointments }
  }

  /**
   * Update client by ID
   */
  static async updateClient(id: string, updateData: any) {
    // Get the old client data before updating
    const oldClient = await Client.findById(id).lean()
    
    const client = await Client.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean()
    
    return { updated: client, oldClient }
  }

  /**
   * Delete client by ID
   */
  static async deleteClient(id: string) {
    // Get the client data before deleting
    const client = await Client.findById(id).lean()
    const deleted = await Client.findByIdAndDelete(id)
    return { deleted, client }
  }

  /**
   * Get client medications
   */
  static async getClientMedications(clientId: string) {
    return ClientMedication.find({ client: clientId })
      .sort({ startDate: -1 })
      .lean()
  }

  /**
   * Get client immunizations
   */
  static async getClientImmunizations(clientId: string) {
    return ClientImmunization.find({ client: clientId })
      .sort({ date: -1 })
      .lean()
  }

  /**
   * Get client test results
   */
  static async getClientTestResults(clientId: string) {
    return ClientTestResult.find({ client: clientId })
      .populate('doctor', 'name')
      .sort({ testDate: -1 })
      .lean()
  }

  /**
   * Get client with all related records
   */
  static async getClientWithRecords(id: string) {
    const client = await Client.findById(id).lean()
    if (!client) {
      return null
    }

    const [medications, immunizations, testResults, appointments] = await Promise.all([
      this.getClientMedications(id),
      this.getClientImmunizations(id),
      this.getClientTestResults(id),
      Appointment.find({ client: id }).sort({ date: -1 }).lean(),
    ])

    return {
      client,
      medications,
      immunizations,
      testResults,
      appointments,
    }
  }
}


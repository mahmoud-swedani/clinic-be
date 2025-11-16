import { Appointment } from '../models/appointment.model'
import { AppointmentService } from '../models/appointmentService.model'
import { User } from '../models/user.model'
import Service from '../models/services.model'
import { Department } from '../models/departments.model'
import { getUserRoleName } from './roleLookup.service'

export class AppointmentService {
  /**
   * Validate user exists and is active
   * Now accepts any user (not just doctors)
   */
  static async validateDoctor(userId: string) {
    const user = await User.findById(userId)
      .populate('roleId', 'name')
      .lean()
    
    if (!user || !user.isActive) {
      throw new Error('المستخدم غير موجود أو غير نشط')
    }
    
    return user
  }

  /**
   * Validate that user belongs to the specified department
   */
  static async validateUserBelongsToDepartment(userId: string, departmentId: string) {
    const user = await User.findById(userId).lean()
    
    if (!user) {
      throw new Error('المستخدم غير موجود')
    }

    // Manager, Owner, and Reception don't need department assignment
    const userRoleName = getUserRoleName(user)
    if (userRoleName === 'مدير' || userRoleName === 'مالك' || userRoleName === 'سكرتير') {
      return true // These roles can be assigned to any department
    }

    // Check if user has access to all departments
    if (user.hasAllDepartments) {
      return true
    }

    // Check if user has the department in their departments array
    const userDepartments = user.departments || []
    const departmentObjectId = departmentId as any
    
    const hasDepartment = userDepartments.some(
      (deptId) => deptId.toString() === departmentObjectId.toString()
    )

    if (!hasDepartment) {
      throw new Error('المستخدم المحدد لا ينتمي إلى القسم المحدد')
    }

    return true
  }

  /**
   * Validate service exists
   */
  static async validateService(serviceId: string) {
    const serviceExists = await Service.findById(serviceId)
    if (!serviceExists) {
      throw new Error('الخدمة المختارة غير موجودة')
    }
    return serviceExists
  }

  /**
   * Validate department exists
   */
  static async validateDepartment(departmentId: string) {
    const departmentExists = await Department.findById(departmentId)
    if (!departmentExists) {
      throw new Error('القسم المختار غير موجود')
    }
    return departmentExists
  }

  /**
   * Validate all services belong to the same department
   */
  static async validateServicesBelongToDepartment(serviceIds: string[], departmentId: string) {
    const services = await Service.find({ _id: { $in: serviceIds } }).lean()
    
    if (services.length !== serviceIds.length) {
      throw new Error('بعض الخدمات المختارة غير موجودة')
    }

    const invalidServices = services.filter(
      (service) => service.departmentId.toString() !== departmentId.toString()
    )

    if (invalidServices.length > 0) {
      throw new Error('جميع الخدمات يجب أن تنتمي إلى نفس القسم')
    }

    return true
  }

  /**
   * Create a new appointment
   * Now supports multiple services via services array
   */
  static async createAppointment(appointmentData: any) {
    const { client, doctor, date, type, notes, service, services, departmentId } =
      appointmentData

    // Support both old (service) and new (services) format for backward compatibility
    const serviceIds = services && Array.isArray(services) && services.length > 0
      ? services
      : service
        ? [service]
        : []

    // Validate required fields
    if (!client || !doctor || !date || !type || serviceIds.length === 0 || !departmentId) {
      throw new Error('جميع الحقول مطلوبة')
    }

    // Validate related entities
    await this.validateDoctor(doctor)
    await this.validateDepartment(departmentId)
    
    // Validate that user belongs to department
    await this.validateUserBelongsToDepartment(doctor, departmentId)

    // Validate all services exist and belong to the same department
    for (const serviceId of serviceIds) {
      await this.validateService(serviceId)
    }
    await this.validateServicesBelongToDepartment(serviceIds, departmentId)

    // Create appointment (keep service field for backward compatibility during migration)
    const appointment = await Appointment.create({
      client,
      doctor,
      date,
      type,
      notes,
      service: serviceIds[0], // Keep first service for backward compatibility
      departmentId,
    })

    // Create AppointmentService entries for each service
    const appointmentServices = []
    for (let i = 0; i < serviceIds.length; i++) {
      const appointmentService = await AppointmentService.create({
        appointment: appointment._id,
        service: serviceIds[i],
        order: i,
      })
      appointmentServices.push(appointmentService)
    }

    // Populate related fields
    await appointment.populate([
      { path: 'client' },
      { path: 'doctor' },
      { path: 'service' },
      { path: 'departmentId' },
    ])

    // Add services to appointment object for response
    const populatedServices = await AppointmentService.find({
      appointment: appointment._id,
    })
      .populate('service')
      .sort({ order: 1 })
      .lean()

    return {
      ...appointment.toObject(),
      services: populatedServices.map((as: any) => as.service),
      appointmentServices: populatedServices,
    }
  }

  /**
   * Get appointments by client ID
   * Filters by doctor if user role is 'طبيب'
   */
  static async getAppointmentsByClient(
    clientId: string,
    user?: any,
    userId?: string
  ) {
    // Build filter based on role
    const filter: any = { client: clientId }
    const userRoleName = user ? getUserRoleName(user) : null
    
    if (userRoleName === 'طبيب' && userId) {
      // Doctors can only see their own appointments for this client
      filter.doctor = userId
    }

    const appointments = await Appointment.find(filter)
      .sort({ date: -1 })
      .populate('client')
      .populate('doctor')
      .populate('service')
      .populate('departmentId')
      .lean()

    // Populate services for each appointment
    const appointmentsWithServices = await Promise.all(
      appointments.map(async (appointment) => {
        const appointmentServices = await AppointmentService.find({
          appointment: appointment._id,
        })
          .populate('service')
          .sort({ order: 1 })
          .lean()

        return {
          ...appointment,
          services: appointmentServices.map((as: any) => as.service),
          appointmentServices: appointmentServices,
        }
      })
    )

    return appointmentsWithServices
  }

  /**
   * Get all appointments with pagination
   * Filters by doctor if user role is 'طبيب'
   */
  static async getAllAppointments(
    page: number,
    limit: number,
    user?: any,
    userId?: string
  ) {
    const skip = (page - 1) * limit

    // Build filter based on role
    const filter: any = {}
    const userRoleName = user ? getUserRoleName(user) : null
    if (userRoleName === 'طبيب' && userId) {
      // Doctors can only see their own appointments
      filter.doctor = userId
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('client', '_id fullName')
        .populate('doctor', '_id name')
        .populate('service', 'name')
        .populate('departmentId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(filter),
    ])

    // Populate services for each appointment
    const appointmentsWithServices = await Promise.all(
      appointments.map(async (appointment) => {
        const appointmentServices = await AppointmentService.find({
          appointment: appointment._id,
        })
          .populate('service', 'name price duration')
          .sort({ order: 1 })
          .lean()

        return {
          ...appointment,
          services: appointmentServices.map((as: any) => as.service),
          appointmentServices: appointmentServices,
        }
      })
    )

    return { appointments: appointmentsWithServices, total }
  }

  /**
   * Get appointment by ID
   * Filters by doctor if user role is 'طبيب'
   */
  static async getAppointmentById(
    id: string,
    user?: any,
    userId?: string
  ) {
    const filter: any = { _id: id }
    const userRoleName = user ? getUserRoleName(user) : null
    if (userRoleName === 'طبيب' && userId) {
      // Doctors can only see their own appointments
      filter.doctor = userId
    }

    const appointment = await Appointment.findOne(filter)
      .populate('client')
      .populate('doctor')
      .populate('service')
      .populate('departmentId')
      .lean()

    if (!appointment) {
      return null
    }

    // Populate services for the appointment
    const appointmentServices = await AppointmentService.find({
      appointment: appointment._id,
    })
      .populate('service')
      .sort({ order: 1 })
      .lean()

    return {
      ...appointment,
      services: appointmentServices.map((as: any) => as.service),
      appointmentServices: appointmentServices,
    }
  }

  /**
   * Update appointment by ID
   */
  static async updateAppointment(id: string, updateData: any) {
    // Validate user belongs to department if both are being updated
    if (updateData.doctor && updateData.departmentId) {
      await this.validateUserBelongsToDepartment(updateData.doctor, updateData.departmentId)
    } else if (updateData.doctor) {
      // If only doctor is updated, get department from existing appointment
      const existingAppointment = await Appointment.findById(id).lean()
      if (existingAppointment?.departmentId) {
        await this.validateUserBelongsToDepartment(
          updateData.doctor,
          existingAppointment.departmentId.toString()
        )
      }
    } else if (updateData.departmentId) {
      // If only department is updated, get doctor from existing appointment
      const existingAppointment = await Appointment.findById(id).lean()
      if (existingAppointment?.doctor) {
        await this.validateUserBelongsToDepartment(
          existingAppointment.doctor.toString(),
          updateData.departmentId
        )
      }
    }

    // Get the old appointment data before updating
    const oldAppointment = await Appointment.findById(id)
      .populate('client')
      .populate('doctor')
      .populate('service')
      .populate('departmentId')
      .lean()

    const updated = await Appointment.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate('client')
      .populate('doctor')
      .populate('service')
      .populate('departmentId')
      .lean()

    return { updated, oldAppointment }
  }

  /**
   * Delete appointment by ID
   */
  static async deleteAppointment(id: string) {
    // Get the appointment data before deleting
    const appointment = await Appointment.findById(id)
      .populate('client')
      .populate('doctor')
      .populate('service')
      .populate('departmentId')
      .lean()

    // Delete all AppointmentService entries for this appointment
    await AppointmentService.deleteMany({ appointment: id })

    const deleted = await Appointment.findByIdAndDelete(id)
    return { deleted, appointment }
  }

  /**
   * Add a service to an appointment
   */
  static async addServiceToAppointment(appointmentId: string, serviceId: string) {
    // Validate appointment exists
    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      throw new Error('الموعد غير موجود')
    }

    // Validate service exists
    await this.validateService(serviceId)

    // Validate service belongs to appointment's department
    await this.validateServicesBelongToDepartment([serviceId], appointment.departmentId.toString())

    // Check if service already exists in appointment
    const existing = await AppointmentService.findOne({
      appointment: appointmentId,
      service: serviceId,
    })

    if (existing) {
      throw new Error('الخدمة موجودة بالفعل في هذا الموعد')
    }

    // Get current max order
    const maxOrder = await AppointmentService.findOne({ appointment: appointmentId })
      .sort({ order: -1 })
      .lean()

    const order = maxOrder ? (maxOrder.order || 0) + 1 : 0

    // Create AppointmentService entry
    const appointmentService = await AppointmentService.create({
      appointment: appointmentId,
      service: serviceId,
      order,
    })

    // Populate and return
    await appointmentService.populate('service')
    return appointmentService
  }

  /**
   * Remove a service from an appointment
   */
  static async removeServiceFromAppointment(appointmentId: string, serviceId: string) {
    // Validate appointment exists
    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      throw new Error('الموعد غير موجود')
    }

    // Find and delete AppointmentService entry
    const appointmentService = await AppointmentService.findOneAndDelete({
      appointment: appointmentId,
      service: serviceId,
    })

    if (!appointmentService) {
      throw new Error('الخدمة غير موجودة في هذا الموعد')
    }

    // Check if appointment has any remaining services
    const remainingServices = await AppointmentService.countDocuments({
      appointment: appointmentId,
    })

    if (remainingServices === 0) {
      throw new Error('لا يمكن حذف آخر خدمة من الموعد. يجب أن يحتوي الموعد على خدمة واحدة على الأقل')
    }

    return appointmentService
  }

  /**
   * Get all services for an appointment
   */
  static async getAppointmentServices(appointmentId: string) {
    const appointmentServices = await AppointmentService.find({
      appointment: appointmentId,
    })
      .populate('service')
      .sort({ order: 1 })
      .lean()

    return appointmentServices
  }
}


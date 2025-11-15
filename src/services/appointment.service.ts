import { Appointment } from '../models/appointment.model'
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
   * Create a new appointment
   */
  static async createAppointment(appointmentData: any) {
    const { client, doctor, date, type, notes, service, departmentId } =
      appointmentData

    // Validate required fields
    if (!client || !doctor || !date || !type || !service || !departmentId) {
      throw new Error('جميع الحقول مطلوبة')
    }

    // Validate related entities
    await this.validateDoctor(doctor)
    await this.validateService(service)
    await this.validateDepartment(departmentId)
    
    // Validate that user belongs to department
    await this.validateUserBelongsToDepartment(doctor, departmentId)

    // Create appointment
    const appointment = await Appointment.create({
      client,
      doctor,
      date,
      type,
      notes,
      service,
      departmentId,
    })

    // Populate related fields
    await appointment.populate([
      { path: 'client' },
      { path: 'doctor' },
      { path: 'service' },
      { path: 'departmentId' },
    ])

    return appointment
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

    return appointments
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

    return { appointments, total }
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

    return appointment
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

    const deleted = await Appointment.findByIdAndDelete(id)
    return { deleted, appointment }
  }
}


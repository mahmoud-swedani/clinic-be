import { Appointment } from '../models/appointment.model'
import { User } from '../models/user.model'
import Service from '../models/services.model'
import { Department } from '../models/departments.model'
import { getUserRoleName } from './roleLookup.service'

export class AppointmentService {
  /**
   * Validate doctor exists and is active
   */
  static async validateDoctor(doctorId: string) {
    const doctorUser = await User.findById(doctorId)
      .populate('roleId', 'name')
      .lean()
    
    if (!doctorUser || !doctorUser.isActive) {
      throw new Error('الطبيب غير موجود أو غير نشط')
    }

    // Check if user has doctor role (from database or enum)
    const userRoleName = getUserRoleName(doctorUser)
    if (userRoleName !== 'طبيب') {
      throw new Error('المستخدم ليس لديه صلاحية الطبيب')
    }
    
    return doctorUser
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
    const { patient, doctor, date, type, notes, service, departmentId } =
      appointmentData

    // Validate required fields
    if (!patient || !doctor || !date || !type || !service || !departmentId) {
      throw new Error('جميع الحقول مطلوبة')
    }

    // Validate related entities
    await this.validateDoctor(doctor)
    await this.validateService(service)
    await this.validateDepartment(departmentId)

    // Create appointment
    const appointment = await Appointment.create({
      patient,
      doctor,
      date,
      type,
      notes,
      service,
      departmentId,
    })

    // Populate related fields
    await appointment.populate([
      { path: 'patient' },
      { path: 'doctor' },
      { path: 'service' },
      { path: 'departmentId' },
    ])

    return appointment
  }

  /**
   * Get appointments by patient ID
   */
  static async getAppointmentsByPatient(patientId: string) {
    const appointments = await Appointment.find({
      patient: patientId,
    })
      .sort({ date: -1 })
      .populate('patient')
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
        .populate('patient', '_id fullName')
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
      .populate('patient')
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
    const updated = await Appointment.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate('patient')
      .populate('doctor')
      .populate('service')
      .populate('departmentId')
      .lean()

    return updated
  }

  /**
   * Delete appointment by ID
   */
  static async deleteAppointment(id: string) {
    const deleted = await Appointment.findByIdAndDelete(id)
    return deleted
  }
}


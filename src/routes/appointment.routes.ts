import { Router } from 'express'
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByPatient,
} from '../controllers/appointment.controller'
import { protect, authorizeRoles, authorizePermission, authorizePermissionOrRole } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate'
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from '../validations/appointment.validation'

const router = Router()

// كل الراوتر محمي بالـ protect
router.use(protect)

// السماح للمالك والمدير والسكرتير بإنشاء المواعيد
const createAllowedRoles = ['مدير', 'مالك', 'سكرتير']

// السماح للمالك والمدير بإدارة المواعيد الكاملة
const manageAllowedRoles = ['مدير', 'مالك']

// السماح للأطباء بعرض مواعيدهم الخاصة
// Allow users with patients.view-appointments OR appointments.view permission OR roles: 'مدير', 'مالك', 'طبيب'
router.get(
  '/patient/:patientId',
  authorizePermissionOrRole(
    ['patients.view-appointments', 'appointments.view'],
    ['مدير', 'مالك', 'طبيب']
  ),
  getAppointmentsByPatient
)
router.get('/', getAllAppointments) // Role filtering handled in controller
router.get('/:id', getAppointmentById) // Role filtering handled in controller

// إنشاء المواعيد: المالك والمدير والسكرتير
router.post(
  '/',
  authorizeRoles(...createAllowedRoles),
  validate(createAppointmentSchema),
  createAppointment
)

// تحديث المواعيد: المالك والمدير والسكرتير أو من لديه صلاحية appointments.edit
router.put(
  '/:id',
  authorizePermissionOrRole(
    ['appointments.edit'],
    ['مدير', 'مالك', 'سكرتير']
  ),
  validate(updateAppointmentSchema),
  updateAppointment
)
// حذف المواعيد: المالك والمدير فقط
router.delete('/:id', authorizeRoles(...manageAllowedRoles), deleteAppointment)

export default router

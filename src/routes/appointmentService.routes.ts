import { Router } from 'express'
import {
  addServiceToAppointment,
  removeServiceFromAppointment,
  getAppointmentServices,
  reorderServices,
} from '../controllers/appointmentService.controller'
import { protect, authorizePermissionOrRole } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate'
import { z } from 'zod'

const router = Router()

// All routes require authentication
router.use(protect)

// Validation schemas
const addServiceSchema = z.object({
  serviceId: z.string().min(1, 'معرف الخدمة مطلوب'),
})

const reorderServicesSchema = z.object({
  serviceOrders: z.array(
    z.object({
      serviceId: z.string().min(1),
      order: z.number().int().min(0),
    })
  ),
})

// Get all services for an appointment
router.get(
  '/:appointmentId/services',
  authorizePermissionOrRole(
    ['appointments.view'],
    ['مدير', 'مالك', 'طبيب', 'سكرتير']
  ),
  getAppointmentServices
)

// Add service to appointment
router.post(
  '/:appointmentId/services',
  authorizePermissionOrRole(
    ['appointments.edit'],
    ['مدير', 'مالك', 'سكرتير']
  ),
  validate(addServiceSchema),
  addServiceToAppointment
)

// Remove service from appointment
router.delete(
  '/:appointmentId/services/:serviceId',
  authorizePermissionOrRole(
    ['appointments.edit'],
    ['مدير', 'مالك', 'سكرتير']
  ),
  removeServiceFromAppointment
)

// Reorder services
router.put(
  '/:appointmentId/services/reorder',
  authorizePermissionOrRole(
    ['appointments.edit'],
    ['مدير', 'مالك', 'سكرتير']
  ),
  validate(reorderServicesSchema),
  reorderServices
)

export default router


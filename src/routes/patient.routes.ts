import { Router } from 'express'
import {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientWithAppointments,
} from '../controllers/patient.controller'
import { validate } from '../middlewares/validate'
import { createPatientSchema } from '../validations/patient.validation'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.post(
  '/',
  protect,
  authorizeRoles('مالك', 'سكرتير', 'طبيب'),
  validate(createPatientSchema),
  createPatient
)

router.get(
  '/:id',
  protect,
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getPatientById
)

router.put(
  '/:id',
  protect,
  authorizeRoles('مالك', 'سكرتير', 'طبيب'),
  updatePatient
)

// الآن نضيف حماية ومسؤوليات لمسح المريض
router.delete('/:id', protect, authorizeRoles('مالك', 'مدير'), deletePatient)

router.get(
  '/',
  protect,
  authorizeRoles('مالك', 'مدير', 'محاسب', 'طبيب', 'سكرتير'),
  getAllPatients
)

router.get(
  '/:id/with-appointments',
  protect,
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getPatientWithAppointments
)

export default router

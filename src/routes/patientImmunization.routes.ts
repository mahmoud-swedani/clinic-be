// src/routes/patientImmunization.routes.ts
import { Router } from 'express'
import {
  createPatientImmunization,
  getPatientImmunizations,
  getImmunizationById,
  updateImmunization,
  deleteImmunization,
} from '../controllers/patientImmunization.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

// All routes require authentication
router.use(protect)

// Create immunization for a patient
router.post(
  '/patients/:patientId/immunizations',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  createPatientImmunization
)

// Get all immunizations for a patient
router.get(
  '/patients/:patientId/immunizations',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getPatientImmunizations
)

// Get immunization by ID
router.get(
  '/immunizations/:id',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getImmunizationById
)

// Update immunization
router.put(
  '/immunizations/:id',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  updateImmunization
)

// Delete immunization
router.delete(
  '/immunizations/:id',
  authorizeRoles('مالك', 'مدير', 'طبيب'),
  deleteImmunization
)

export default router


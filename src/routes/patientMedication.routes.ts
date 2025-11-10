// src/routes/patientMedication.routes.ts
import { Router } from 'express'
import {
  createPatientMedication,
  getPatientMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
} from '../controllers/patientMedication.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

// All routes require authentication
router.use(protect)

// Create medication for a patient
router.post(
  '/patients/:patientId/medications',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  createPatientMedication
)

// Get all medications for a patient
router.get(
  '/patients/:patientId/medications',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getPatientMedications
)

// Get medication by ID
router.get(
  '/medications/:id',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getMedicationById
)

// Update medication
router.put(
  '/medications/:id',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  updateMedication
)

// Delete medication
router.delete(
  '/medications/:id',
  authorizeRoles('مالك', 'مدير', 'طبيب'),
  deleteMedication
)

export default router


// src/routes/clientMedication.routes.ts
import { Router } from 'express'
import {
  createClientMedication,
  getClientMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
} from '../controllers/clientMedication.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

// All routes require authentication
router.use(protect)

// Create medication for a client
router.post(
  '/clients/:clientId/medications',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  createClientMedication
)

// Get all medications for a client
router.get(
  '/clients/:clientId/medications',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getClientMedications
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


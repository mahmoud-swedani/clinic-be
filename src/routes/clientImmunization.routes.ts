// src/routes/clientImmunization.routes.ts
import { Router } from 'express'
import {
  createClientImmunization,
  getClientImmunizations,
  getImmunizationById,
  updateImmunization,
  deleteImmunization,
} from '../controllers/clientImmunization.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

// All routes require authentication
router.use(protect)

// Create immunization for a client
router.post(
  '/clients/:clientId/immunizations',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  createClientImmunization
)

// Get all immunizations for a client
router.get(
  '/clients/:clientId/immunizations',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getClientImmunizations
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


// src/routes/patientTestResult.routes.ts
import { Router } from 'express'
import {
  createPatientTestResult,
  getPatientTestResults,
  getTestResultById,
  updateTestResult,
  deleteTestResult,
} from '../controllers/patientTestResult.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

// All routes require authentication
router.use(protect)

// Create test result for a patient
router.post(
  '/patients/:patientId/test-results',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  createPatientTestResult
)

// Get all test results for a patient
router.get(
  '/patients/:patientId/test-results',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getPatientTestResults
)

// Get test result by ID
router.get(
  '/test-results/:id',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getTestResultById
)

// Update test result
router.put(
  '/test-results/:id',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  updateTestResult
)

// Delete test result
router.delete(
  '/test-results/:id',
  authorizeRoles('مالك', 'مدير', 'طبيب'),
  deleteTestResult
)

export default router


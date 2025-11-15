// src/routes/clientTestResult.routes.ts
import { Router } from 'express'
import {
  createClientTestResult,
  getClientTestResults,
  getTestResultById,
  updateTestResult,
  deleteTestResult,
} from '../controllers/clientTestResult.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

// All routes require authentication
router.use(protect)

// Create test result for a client
router.post(
  '/clients/:clientId/test-results',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  createClientTestResult
)

// Get all test results for a client
router.get(
  '/clients/:clientId/test-results',
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getClientTestResults
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


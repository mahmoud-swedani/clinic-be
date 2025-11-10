// src/routes/auditLog.routes.ts
import express from 'express'
import {
  getAuditLogs,
  getEntityAuditHistory,
  getUserAuditHistory,
  getAppointmentActivities,
  getPatientActivities,
} from '../controllers/auditLog.controller'
import { protect, authorizeRoles, authorizeAnyPermission } from '../middlewares/auth.middleware'

const router = express.Router()

// Only Owner and Manager can view audit logs
router.get('/', protect, authorizeRoles('مالك', 'مدير'), getAuditLogs)
router.get(
  '/entity/:entityType/:entityId',
  protect,
  authorizeRoles('مالك', 'مدير'),
  getEntityAuditHistory
)
router.get(
  '/user/:id',
  protect,
  authorizeRoles('مالك', 'مدير'),
  getUserAuditHistory
)

// Get appointment activities - allow users with appointments.view-activities permission
router.get(
  '/appointments/:appointmentId',
  protect,
  authorizeAnyPermission('appointments.view-activities', 'appointments.view', 'audit-logs.view'),
  getAppointmentActivities
)

// Get patient activities - allow users with patients.view-activities permission
router.get(
  '/patients/:patientId',
  protect,
  authorizeAnyPermission('patients.view-activities', 'patients.view', 'audit-logs.view'),
  getPatientActivities
)

export default router


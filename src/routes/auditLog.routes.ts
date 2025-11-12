// src/routes/auditLog.routes.ts
import express from 'express'
import {
  getAuditLogs,
  getEntityAuditHistory,
  getUserAuditHistory,
  getAppointmentActivities,
  getPatientActivities,
  getTreatmentStageActivities,
} from '../controllers/auditLog.controller'
import { protect, authorizeRoles, authorizeAnyPermission, authorizePermissionOrRole } from '../middlewares/auth.middleware'

const router = express.Router()

// Allow users with appropriate permissions OR Owner/Manager roles to view audit logs
// The controller will check entityType and allow appropriate permissions (appointments, treatment-stages, etc.)
router.get('/', protect, authorizePermissionOrRole(['appointments.view-activities', 'treatment-stages.view', 'treatment-stages.view-activities', 'audit-logs.view'], ['مالك', 'مدير']), getAuditLogs)
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

// Get treatment stage activities - allow users with treatment-stages.view permission
router.get(
  '/treatment-stages/:stageId',
  protect,
  authorizeAnyPermission('treatment-stages.view', 'treatment-stages.view-activities', 'audit-logs.view'),
  getTreatmentStageActivities
)

export default router


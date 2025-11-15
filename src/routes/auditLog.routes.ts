// src/routes/auditLog.routes.ts
import express from 'express'
import {
  getAuditLogs,
  getEntityAuditHistory,
  getUserAuditHistory,
  getAppointmentActivities,
  getClientActivities,
  getTreatmentStageActivities,
  getInvoiceActivities,
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

// Get client activities - allow users with clients.view-activities permission
// Also support old patients.* permissions for backward compatibility
router.get(
  '/clients/:clientId',
  protect,
  authorizeAnyPermission(
    'clients.view-activities',
    'clients.view',
    'patients.view-activities', // Backward compatibility
    'patients.view', // Backward compatibility
    'audit-logs.view'
  ),
  getClientActivities
)

// Get treatment stage activities - allow users with treatment-stages.view permission
router.get(
  '/treatment-stages/:stageId',
  protect,
  authorizeAnyPermission('treatment-stages.view', 'treatment-stages.view-activities', 'audit-logs.view'),
  getTreatmentStageActivities
)

// Get invoice activities - allow users with invoices.view permission or audit-logs.view
router.get(
  '/invoices/:invoiceId',
  protect,
  authorizeAnyPermission('invoices.view', 'audit-logs.view'),
  getInvoiceActivities
)

export default router


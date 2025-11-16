// routes/treatmentStage.routes.ts

import express from 'express'
import {
  createTreatmentStage,
  getTreatmentStagesByClient,
  getTreatmentStagesByAppointment,
  getTreatmentStagesByAppointmentService,
  getTreatmentStageById,
  updateTreatmentStage,
  deleteTreatmentStage,
  getAllTreatmentStages,
} from '../controllers/treatmentStage.controller'
import { protect, authorizeRoles, authorizeAnyPermission, authorizePermissionOrRole } from '../middlewares/auth.middleware'

const router = express.Router()

// POST - إضافة مرحلة
// Allow either treatment-stages.create OR appointments.add-treatment-stage permission
router.post(
  '/',
  protect,
  authorizeAnyPermission('treatment-stages.create', 'appointments.add-treatment-stage'),
  createTreatmentStage
)

// GET - جلب مراحل عميل
// Allow users with treatment-stages.view, clients.view, or appointments.view permission
// OR users with مالك, طبيب, or مدير roles (fallback for backward compatibility)
router.get(
  '/client/:clientId',
  protect,
  authorizePermissionOrRole(
    ['treatment-stages.view', 'clients.view', 'appointments.view'],
    ['مالك', 'طبيب', 'مدير']
  ),
  getTreatmentStagesByClient
)

// GET - جلب مراحل علاجية لموعد معين
// Allow users with appointments.view permission to see treatment stages for appointments they can access
router.get(
  '/appointment/:appointmentId',
  protect,
  authorizeAnyPermission('appointments.view', 'treatment-stages.view'),
  getTreatmentStagesByAppointment
)

// GET - جلب مراحل علاجية لخدمة معينة في موعد
router.get(
  '/appointment-service/:appointmentServiceId',
  protect,
  authorizeAnyPermission('appointments.view', 'treatment-stages.view'),
  getTreatmentStagesByAppointmentService
)

// GET - جلب مرحلة واحدة
// Dynamic: Allow users with treatment-stages.view permission
router.get(
  '/:id',
  protect,
  authorizeAnyPermission('treatment-stages.view'),
  getTreatmentStageById
)

// GET - جلب كل المراحل
// Dynamic: Allow users with treatment-stages.view permission (no hardcoded roles)
// This makes it work dynamically when permissions are assigned from frontend
router.get(
  '/',
  protect,
  authorizeAnyPermission('treatment-stages.view'),
  getAllTreatmentStages
)

// PUT - تعديل مرحلة
// Dynamic: Allow users with treatment-stages.edit permission
router.put(
  '/:id',
  protect,
  authorizeAnyPermission('treatment-stages.edit'),
  updateTreatmentStage
)

// DELETE - حذف مرحلة
// Dynamic: Allow users with treatment-stages.delete permission
router.delete(
  '/:id',
  protect,
  authorizeAnyPermission('treatment-stages.delete'),
  deleteTreatmentStage
)

export default router

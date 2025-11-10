// routes/treatmentStage.routes.ts

import express from 'express'
import {
  createTreatmentStage,
  getTreatmentStagesByPatient,
  getTreatmentStagesByAppointment,
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

// GET - جلب مراحل مريض
// Allow users with treatment-stages.view, patients.view, or appointments.view permission
// OR users with مالك, طبيب, or مدير roles (fallback for backward compatibility)
router.get(
  '/patient/:patientId',
  protect,
  authorizePermissionOrRole(
    ['treatment-stages.view', 'patients.view', 'appointments.view'],
    ['مالك', 'طبيب', 'مدير']
  ),
  getTreatmentStagesByPatient
)

// GET - جلب مراحل علاجية لموعد معين
// Allow users with appointments.view permission to see treatment stages for appointments they can access
router.get(
  '/appointment/:appointmentId',
  protect,
  authorizeAnyPermission('appointments.view', 'treatment-stages.view'),
  getTreatmentStagesByAppointment
)

//جلب مراحل كل
router.get('/', protect, authorizeRoles('مدير', 'مالك'), getAllTreatmentStages)

// PUT - تعديل مرحلة
router.put('/:id', protect, authorizeRoles('مدير'), updateTreatmentStage)

// DELETE - حذف مرحلة
router.delete('/:id', protect, authorizeRoles('مدير'), deleteTreatmentStage)

export default router

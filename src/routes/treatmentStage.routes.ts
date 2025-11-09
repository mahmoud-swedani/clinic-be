// routes/treatmentStage.routes.ts

import express from 'express'
import {
  createTreatmentStage,
  getTreatmentStagesByPatient,
  updateTreatmentStage,
  deleteTreatmentStage,
  getAllTreatmentStages,
} from '../controllers/treatmentStage.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = express.Router()

// POST - إضافة مرحلة
router.post('/', protect, authorizeRoles('مالك', 'طبيب'), createTreatmentStage)

// GET - جلب مراحل مريض
router.get(
  '/patient/:patientId',
  protect,
  authorizeRoles('مالك', 'طبيب', 'مدير'),
  getTreatmentStagesByPatient
)

//جلب مراحل كل
router.get('/', protect, authorizeRoles('مدير', 'مالك'), getAllTreatmentStages)

// PUT - تعديل مرحلة
router.put('/:id', protect, authorizeRoles('مدير'), updateTreatmentStage)

// DELETE - حذف مرحلة
router.delete('/:id', protect, authorizeRoles('مدير'), deleteTreatmentStage)

export default router

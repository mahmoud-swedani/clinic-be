// src/routes/auditLog.routes.ts
import express from 'express'
import {
  getAuditLogs,
  getEntityAuditHistory,
  getUserAuditHistory,
} from '../controllers/auditLog.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

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

export default router


// src/routes/rolePermission.routes.ts
import express from 'express'
import {
  assignPermissions,
  removePermission,
  getRolePermissions,
  replaceRolePermissions,
} from '../controllers/rolePermission.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate'
import {
  assignPermissionsSchema,
  replacePermissionsSchema,
} from '../validations/rolePermission.validation'

const router = express.Router()

// Only Owner can manage role-permission assignments
router.post(
  '/:id/permissions',
  protect,
  authorizeRoles('مالك'),
  validate(assignPermissionsSchema),
  assignPermissions
)
router.get(
  '/:id/permissions',
  protect,
  authorizeRoles('مالك', 'مدير'),
  getRolePermissions
)
router.put(
  '/:id/permissions',
  protect,
  authorizeRoles('مالك'),
  validate(replacePermissionsSchema),
  replaceRolePermissions
)
router.delete(
  '/:id/permissions/:permissionId',
  protect,
  authorizeRoles('مالك'),
  removePermission
)

export default router


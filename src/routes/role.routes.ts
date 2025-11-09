// src/routes/role.routes.ts
import express from 'express'
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
} from '../controllers/role.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate'
import {
  createRoleSchema,
  updateRoleSchema,
} from '../validations/role.validation'

const router = express.Router()

// Only Owner can manage roles
router.post(
  '/',
  protect,
  authorizeRoles('مالك'),
  validate(createRoleSchema),
  createRole
)
router.get('/', protect, authorizeRoles('مالك', 'مدير'), getAllRoles)
router.get('/:id', protect, authorizeRoles('مالك', 'مدير'), getRoleById)
router.put(
  '/:id',
  protect,
  authorizeRoles('مالك'),
  validate(updateRoleSchema),
  updateRole
)
router.delete('/:id', protect, authorizeRoles('مالك'), deleteRole)

export default router


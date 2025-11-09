// src/routes/permission.routes.ts
import express from 'express'
import {
  createPermission,
  getAllPermissions,
  getPermissionsByCategory,
  getPermissionById,
  updatePermission,
  deletePermission,
  getCategories,
} from '../controllers/permission.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate'
import {
  createPermissionSchema,
  updatePermissionSchema,
} from '../validations/permission.validation'

const router = express.Router()

// Only Owner can manage permissions
router.post(
  '/',
  protect,
  authorizeRoles('مالك'),
  validate(createPermissionSchema),
  createPermission
)
router.get('/', protect, authorizeRoles('مالك', 'مدير'), getAllPermissions)
router.get(
  '/categories',
  protect,
  authorizeRoles('مالك', 'مدير'),
  getPermissionsByCategory
)
router.get(
  '/categories/list',
  protect,
  authorizeRoles('مالك', 'مدير'),
  getCategories
)
router.get(
  '/:id',
  protect,
  authorizeRoles('مالك', 'مدير'),
  getPermissionById
)
router.put(
  '/:id',
  protect,
  authorizeRoles('مالك'),
  validate(updatePermissionSchema),
  updatePermission
)
router.delete('/:id', protect, authorizeRoles('مالك'), deletePermission)

export default router


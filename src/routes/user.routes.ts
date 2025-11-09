import express from 'express'
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from '../controllers/user.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate'
import { createUserSchema, updateUserSchema } from '../validations/user.validation'

const router = express.Router()

// فقط المدير أو المالك يمكنه إدارة المستخدمين
router.post(
  '/',
  protect,
  authorizeRoles('مدير', 'مالك'),
  validate(createUserSchema),
  createUser
)
router.get('/', protect, authorizeRoles('مدير', 'مالك'), getAllUsers)
router.get('/:id', protect, authorizeRoles('مدير', 'مالك'), getUserById)
router.put(
  '/:id',
  protect,
  authorizeRoles('مدير', 'مالك'),
  validate(updateUserSchema),
  updateUser
)
router.delete('/:id', protect, authorizeRoles('مدير', 'مالك'), deleteUser)
router.patch(
  '/:id/toggle-status',
  protect,
  authorizeRoles('مدير', 'مالك'),
  toggleUserStatus
)

export default router

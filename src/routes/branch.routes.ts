import express from 'express'
import {
  createBranch,
  getAllBranches,
  updateBranch,
  deleteBranch,
} from '../controllers/branch.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = express.Router()

router.use(protect)

router.post('/', authorizeRoles('مالك', 'مدير'), createBranch)
router.get('/', authorizeRoles('مالك', 'مدير'), getAllBranches)
router.put('/:id', authorizeRoles('مالك', 'مدير'), updateBranch)
router.delete('/:id', authorizeRoles('مالك', 'مدير'), deleteBranch)

export default router

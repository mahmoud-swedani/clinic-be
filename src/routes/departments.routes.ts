import express from 'express'
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departments.controller'
import { protect } from '../middlewares/auth.middleware'

const router = express.Router()

// All department routes require authentication
router.use(protect)

router.get('/', getDepartments)
router.get('/:id', getDepartmentById)
router.post('/', createDepartment)
router.put('/:id', updateDepartment)
router.delete('/:id', deleteDepartment)

export default router

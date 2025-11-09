import { Router } from 'express'
import {
  createService,
  getAllServices,
  getServicesByDepartment,
  updateService,
  deleteService,
  getServiceById,
} from '../controllers/services.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', protect, authorizeRoles('مالك', 'مدير'), createService)
router.get('/', protect, getAllServices)
router.get('/:id', protect, getServiceById)
router.get('/by-department/:departmentId', protect, getServicesByDepartment)
router.put('/:id', protect, authorizeRoles('مالك', 'مدير'), updateService)
router.delete('/:id', protect, authorizeRoles('مالك', 'مدير'), deleteService)

export default router

import { Router } from 'express'
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientWithAppointments,
} from '../controllers/client.controller'
import { validate } from '../middlewares/validate'
import { createClientSchema } from '../validations/client.validation'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

router.post(
  '/',
  protect,
  authorizeRoles('مالك', 'سكرتير', 'طبيب'),
  validate(createClientSchema),
  createClient
)

router.get(
  '/:id',
  protect,
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getClientById
)

router.put(
  '/:id',
  protect,
  authorizeRoles('مالك', 'سكرتير', 'طبيب'),
  updateClient
)

// الآن نضيف حماية ومسؤوليات لمسح العميل
router.delete('/:id', protect, authorizeRoles('مالك', 'مدير'), deleteClient)

router.get(
  '/',
  protect,
  authorizeRoles('مالك', 'مدير', 'محاسب', 'طبيب', 'سكرتير'),
  getAllClients
)

router.get(
  '/:id/with-appointments',
  protect,
  authorizeRoles('مالك', 'مدير', 'طبيب', 'سكرتير'),
  getClientWithAppointments
)

export default router


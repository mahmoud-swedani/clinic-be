import express from 'express'
import {
  getDoctors,
  getManagers,
  getAccountants,
  getSecretaries,
} from '../controllers/user.controller'
import { protect, authorizeRoles } from '../middlewares/auth.middleware'

const router = express.Router()

router.get('/doctors', protect, authorizeRoles('مالك', 'طبيب', 'سكرتير'), getDoctors)
router.get('/managers', protect, authorizeRoles('مالك'), getManagers)
router.get('/accountants', protect, authorizeRoles('مالك'), getAccountants)
router.get('/secretaries', protect, authorizeRoles('مالك'), getSecretaries)

export default router

// src/routes/analytics.routes.ts
import { Router } from 'express'
import {
  getExecutiveAnalytics,
  getDepartmentAnalytics,
  getServiceAnalytics,
} from '../controllers/analytics.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

// All analytics routes require authentication
router.use(protect)

router.get('/executive', getExecutiveAnalytics)
router.get('/departments/:id', getDepartmentAnalytics)
router.get('/services/:id', getServiceAnalytics)

export default router








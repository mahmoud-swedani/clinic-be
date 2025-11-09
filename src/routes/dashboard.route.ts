import { Router } from 'express'
import { getDashboardData } from '../controllers/dashboard.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

// Dashboard route requires authentication
router.use(protect)

router.get('/', getDashboardData)

export default router

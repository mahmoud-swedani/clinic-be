// routes/auth.routes.ts
import express from 'express'
import { login, getMe, logout } from '../controllers/auth.controller'

import { protect } from '../middlewares/auth.middleware'
import { authLimiter } from '../middlewares/rateLimit.middleware'

const router = express.Router()

router.post('/login', authLimiter, login)
router.get('/me', protect, getMe)
router.post('/logout', logout)

export default router

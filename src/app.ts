// src/app.ts

import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import morgan from 'morgan'
import { apiLimiter } from './middlewares/rateLimit.middleware'
import logger from './utils/logger'

// استيراد المسارات
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import clientRoutes from './routes/client.routes'
import appointmentRoutes from './routes/appointment.routes'
import appointmentServiceRoutes from './routes/appointmentService.routes'
import branchRoutes from './routes/branch.routes'
import treatmentStageRoutes from './routes/treatmentStage.routes'
import invoiceRoutes from './routes/invoice.routes'
import paymentRoutes from './routes/payment.routes'
import dashboardRoutes from './routes/dashboard.route'
import financialRecordRoutes from './routes/financialRecord.routes'
import productRoutes from './routes/product.routes'
import saleRoutes from './routes/sale.routes'
import departmentsRoutes from './routes/departments.routes'
import servicesRoutes from './routes/services.routes'
import analyticsRoutes from './routes/analytics.routes'
import roleRoutes from './routes/role.routes'
import permissionRoutes from './routes/permission.routes'
import rolePermissionRoutes from './routes/rolePermission.routes'
import userRoleRoutes from './routes/userRole.routes'
import auditLogRoutes from './routes/auditLog.routes'
import clientMedicationRoutes from './routes/clientMedication.routes'
import clientImmunizationRoutes from './routes/clientImmunization.routes'
import clientTestResultRoutes from './routes/clientTestResult.routes'

const app = express()

// Trust proxy - required when behind reverse proxy/load balancer
app.set('trust proxy', 1)

// ميدل وير
app.use(cookieParser())

// CORS configuration - supports multiple origins for cross-domain requests
// MUST be applied before rate limiting to handle preflight requests
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : ['http://localhost:3000']

// Helper function to normalize origins (remove trailing slashes)
const normalizeOrigin = (origin: string): string => {
  return origin.replace(/\/$/, '') // Remove trailing slash
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true)
      }
      
      const normalizedOrigin = normalizeOrigin(origin)
      const normalizedAllowedOrigins = allowedOrigins.map(normalizeOrigin)
      
      // Always allow localhost origins (for local development connecting to production)
      // This is safe because localhost is only accessible from the same machine
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        if (process.env.NODE_ENV === 'production') {
          logger.info('CORS: Allowing localhost origin in production', { origin })
        }
        return callback(null, true)
      }
      
      // Check if origin is in allowed list (case-insensitive comparison)
      if (normalizedAllowedOrigins.some(allowed => 
        allowed.toLowerCase() === normalizedOrigin.toLowerCase()
      )) {
        callback(null, true)
      } else {
        // Log the rejected origin for debugging
        logger.warn('CORS: Origin not allowed', {
          origin,
          normalizedOrigin,
          allowedOrigins: normalizedAllowedOrigins,
          nodeEnv: process.env.NODE_ENV
        })
        
        // Return false instead of throwing error to avoid 500 status
        callback(null, false)
      }
    },
    credentials: true, // يسمح بإرسال الكوكيز
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
    preflightContinue: false, // Let CORS handle preflight (don't pass to next middleware)
    maxAge: 86400, // Cache preflight requests for 24 hours
  })
)
app.use(express.json())

// Request logging middleware
if (process.env.NODE_ENV === 'production') {
  // Use Winston for production
  app.use((req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      logger.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
      })
    })
    next()
  })
} else {
  // Use Morgan for development
  app.use(morgan('dev'))
}

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter)

// تعريف المسارات
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api', clientMedicationRoutes)
app.use('/api', clientImmunizationRoutes)
app.use('/api', clientTestResultRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/appointments', appointmentServiceRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/treatment-stages', treatmentStageRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/financial-records', financialRecordRoutes)
app.use('/api/products', productRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/departments', departmentsRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/roles', rolePermissionRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/user-roles', userRoleRoutes)
app.use('/api/audit-logs', auditLogRoutes)

// مسار الاختبار الرئيسي
app.get('/', (req, res) => {
  res.send('Clinic Backend API is running ✅')
})

// Error handling middleware (must be last)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
  })
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'حدث خطأ في الخادم' 
      : err.message,
  })
})

export default app

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const env = require('./config/env')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const { apiLimiter } = require('./middleware/rateLimiter')

// Route imports
const authRoutes = require('./modules/auth/auth.routes')
const userRoutes = require('./modules/users/users.routes')
const householdRoutes = require('./modules/households/households.routes')
const grievanceRoutes = require('./modules/grievances/grievances.routes')
const dashboardRoutes = require('./modules/dashboard/dashboard.routes')
const referenceRoutes = require('./modules/exports/reference.routes')
const exportRoutes = require('./modules/exports/exports.routes')
const uploadRoutes = require('./modules/uploads/uploads.routes')

const app = express()

// Trust proxy (required for Render, Heroku, etc.)
app.set('trust proxy', true)

// Core middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

// Global rate limiter
app.use('/api', apiLimiter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/households', householdRoutes)
app.use('/api/grievances', grievanceRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reference', referenceRoutes)
app.use('/api/exports', exportRoutes)
app.use('/api/uploads', uploadRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app

const { Router } = require('express')
const { z } = require('zod')
const controller = require('./auth.controller')
const { validate } = require('../../middleware/validate')
const { authLimiter } = require('../../middleware/rateLimiter')
const { authenticate } = require('../../middleware/auth')

const router = Router()

// Zod schemas
const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(4, 'Password must be at least 4 characters')
})

const citizenLoginSchema = z.object({
  houseCode: z.string().min(1, 'House code is required'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits')
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional()
})

// Routes
router.post('/login', authLimiter, validate(loginSchema), controller.login)
router.post('/citizen/login', authLimiter, validate(citizenLoginSchema), controller.citizenLogin)
router.post('/refresh', validate(refreshSchema), controller.refresh)
router.post('/logout', authenticate, controller.logout)

module.exports = router

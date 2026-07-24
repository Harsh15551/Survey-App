const rateLimit = require('express-rate-limit')

/**
 * Strict limiter for auth/OTP endpoints (prevent brute-force)
 * 5 requests per minute per IP
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * General API limiter (all other endpoints)
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Rate limit exceeded. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = { authLimiter, apiLimiter }

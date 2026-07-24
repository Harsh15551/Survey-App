const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const env = require('../config/env')

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 5

/**
 * Generate a 6-digit OTP (or use fixed dev OTP in development)
 */
function generateOtp() {
  if (env.NODE_ENV === 'development') {
    return env.DEV_OTP
  }
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * Hash an OTP for secure storage
 */
function hashOtp(otp) {
  return bcrypt.hash(otp, 10)
}

/**
 * Verify an OTP against its hash
 */
function verifyOtp(otp, hash) {
  return bcrypt.compare(otp, hash)
}

/**
 * Get OTP expiry timestamp
 */
function getOtpExpiry() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
}

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
  getOtpExpiry,
  OTP_EXPIRY_MINUTES
}

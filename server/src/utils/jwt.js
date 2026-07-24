const jwt = require('jsonwebtoken')
const env = require('../config/env')

/**
 * Sign an access token for staff users
 */
function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role.toLowerCase(), type: 'staff' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY }
  )
}

/**
 * Sign a refresh token
 */
function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY }
  )
}

/**
 * Sign a citizen access token (scoped to a specific house)
 */
function signCitizenToken(houseCode, phone) {
  return jwt.sign(
    { sub: houseCode, phone, type: 'citizen' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '24h' }
  )
}

/**
 * Verify an access token
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET)
}

/**
 * Verify a refresh token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET)
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  signCitizenToken,
  verifyAccessToken,
  verifyRefreshToken
}

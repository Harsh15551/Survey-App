const bcrypt = require('bcryptjs')
const prisma = require('../../config/database')
const { signAccessToken, signRefreshToken, signCitizenToken, verifyRefreshToken } = require('../../utils/jwt')

/**
 * Staff login: phone + password -> JWT tokens
 */
async function staffLogin(phone, password) {
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    throw { status: 401, expose: true, message: 'No account found for this phone number.' }
  }
  if (user.status === 'INACTIVE') {
    throw { status: 403, expose: true, message: 'This account has been deactivated. Contact your Admin.' }
  }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw { status: 401, expose: true, message: 'Incorrect password.' }
  }

  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user.id)

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role.toLowerCase().replace('_', '_'),
      region: user.region,
      status: user.status.toLowerCase()
    }
  }
}

/**
 * Citizen login: houseCode + 8-digit password -> JWT
 */
async function citizenLogin(houseCode, password) {
  const household = await prisma.household.findUnique({ where: { houseCode } })
  if (!household) {
    throw { status: 404, expose: true, message: 'QR ID not found. Check the QR plate and try again.' }
  }
  const valid = await bcrypt.compare(password, household.citizenPasswordHash)
  if (!valid) {
    throw { status: 403, expose: true, message: 'Incorrect password.' }
  }

  const { citizenPasswordHash, ...safeHousehold } = household
  const accessToken = signCitizenToken(houseCode, household.phone)
  return { accessToken, houseCode, phone: household.phone, household: safeHousehold }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
  try {
    const payload = verifyRefreshToken(refreshToken)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.status === 'INACTIVE') {
      throw { status: 401, expose: true, message: 'Session expired. Please log in again.' }
    }
    const newAccessToken = signAccessToken(user)
    const newRefreshToken = signRefreshToken(user.id)
    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  } catch (err) {
    throw { status: 401, expose: true, message: 'Invalid refresh token. Please log in again.' }
  }
}

module.exports = {
  staffLogin,
  citizenLogin,
  refreshAccessToken
}

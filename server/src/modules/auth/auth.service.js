const bcrypt = require('bcryptjs')
const prisma = require('../../config/database')
const env = require('../../config/env')
const { signAccessToken, signRefreshToken, signCitizenToken, verifyRefreshToken } = require('../../utils/jwt')
const { generateOtp, hashOtp, verifyOtp, getOtpExpiry } = require('../../utils/otp')

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
 * Citizen: request OTP for houseCode + phone
 */
async function citizenRequestOtp(houseCode, phone) {
  // Verify household exists and phone matches
  const household = await prisma.household.findUnique({ where: { houseCode } })
  if (!household) {
    throw { status: 404, expose: true, message: 'House code not found. Check the QR plate and try again.' }
  }
  if (household.phone !== phone) {
    throw { status: 403, expose: true, message: 'Phone number does not match our records for this house code.' }
  }

  // Invalidate previous unused OTPs for this house+phone
  await prisma.otpSession.updateMany({
    where: { houseCode, phone, used: false },
    data: { used: true }
  })

  // Generate and store new OTP
  const otp = generateOtp()
  const otpHash = await hashOtp(otp)
  await prisma.otpSession.create({
    data: {
      houseCode,
      phone,
      otpHash,
      expiresAt: getOtpExpiry()
    }
  })

  // Return OTP in response when DEV_OTP is set (for testing)
  return {
    otpSent: true,
    ...(env.DEV_OTP && { devOtp: otp })
  }
}

/**
 * Citizen: verify OTP -> citizen JWT
 */
async function citizenVerifyOtp(houseCode, phone, otp) {
  // Find latest unused OTP session
  const session = await prisma.otpSession.findFirst({
    where: { houseCode, phone, used: false },
    orderBy: { createdAt: 'desc' }
  })

  if (!session) {
    throw { status: 400, expose: true, message: 'No OTP found. Please request a new one.' }
  }
  if (new Date() > session.expiresAt) {
    throw { status: 400, expose: true, message: 'OTP has expired. Please request a new one.' }
  }

  const valid = await verifyOtp(otp, session.otpHash)
  if (!valid) {
    throw { status: 400, expose: true, message: 'Incorrect OTP. Please try again.' }
  }

  // Mark OTP as used
  await prisma.otpSession.update({
    where: { id: session.id },
    data: { used: true }
  })

  // Fetch household data
  const household = await prisma.household.findUnique({ where: { houseCode } })
  const accessToken = signCitizenToken(houseCode, phone)

  return {
    accessToken,
    houseCode,
    phone,
    household
  }
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
  citizenRequestOtp,
  citizenVerifyOtp,
  refreshAccessToken
}

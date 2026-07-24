import { apiPost, setToken, clearToken } from './client'

/**
 * Staff login (Admin / Supervisor / Field Agent).
 * POST /api/auth/login
 */
export async function staffLogin(phone, password) {
  try {
    const data = await apiPost('/api/auth/login', { phone, password })
    setToken(data.accessToken)
    return { ok: true, user: data.user }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Citizen: request OTP for household login.
 * POST /api/auth/citizen/request-otp
 */
export async function citizenRequestOtp(houseCode, phone) {
  try {
    const data = await apiPost('/api/auth/citizen/request-otp', { houseCode, phone })
    return { ok: true, devOtp: data.devOtp } // devOtp present in development only
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Citizen: verify OTP and get citizen token.
 * POST /api/auth/citizen/verify-otp
 */
export async function citizenVerifyOtp(houseCode, phone, otp) {
  try {
    const data = await apiPost('/api/auth/citizen/verify-otp', { houseCode, phone, otp })
    setToken(data.accessToken)
    return { ok: true, household: data.household }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Logout — clears token locally + invalidates refresh token on server.
 * POST /api/auth/logout
 */
export async function logout() {
  try {
    await apiPost('/api/auth/logout', {})
  } catch {
    // Ignore errors — clear local state regardless
  }
  clearToken()
}

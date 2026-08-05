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
 * Citizen login: houseCode + 8-digit password -> JWT
 * POST /api/auth/citizen/login
 */
export async function citizenLogin(houseCode, password) {
  try {
    const data = await apiPost('/api/auth/citizen/login', { houseCode, password })
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

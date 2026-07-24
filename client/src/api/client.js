// ---------------------------------------------------------------------------
// Base HTTP client. Uses native fetch with JWT token management.
// Access token stored in memory; refresh token in httpOnly cookie (server-side).
// ---------------------------------------------------------------------------

let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
}

// Restore token from localStorage (for page refresh persistence)
const stored = localStorage.getItem('survey_app_token')
if (stored) accessToken = stored

function persistToken(token) {
  if (token) localStorage.setItem('survey_app_token', token)
  else localStorage.removeItem('survey_app_token')
}

// Wrap setAccessToken to also persist
export function setToken(token) {
  accessToken = token
  persistToken(token)
}

export function clearToken() {
  accessToken = null
  persistToken(null)
}

/**
 * Core fetch wrapper with auth headers + automatic token refresh on 401.
 */
export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  let res = await fetch(path, { ...options, headers, credentials: 'include' })

  // Auto-refresh on 401 (one retry only)
  if (res.status === 401 && accessToken) {
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    })
    if (refreshRes.ok) {
      const data = await refreshRes.json()
      setToken(data.accessToken)
      headers['Authorization'] = `Bearer ${data.accessToken}`
      res = await fetch(path, { ...options, headers, credentials: 'include' })
    } else {
      // Refresh failed — force logout
      clearToken()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const error = new Error(err.message || err.error || `Request failed (${res.status})`)
    error.status = res.status
    error.data = err
    throw error
  }

  // Handle 204 No Content
  if (res.status === 204) return null
  return res.json()
}

export function apiGet(path) {
  return apiFetch(path)
}

export function apiPost(path, body) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body) })
}

export function apiPatch(path, body) {
  return apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) })
}

export function apiDelete(path) {
  return apiFetch(path, { method: 'DELETE' })
}

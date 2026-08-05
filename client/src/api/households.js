import { apiGet, apiPost, apiPatch, getAccessToken } from './client'

/**
 * Upload a household photo (data URL → multipart POST).
 */
export async function uploadPhoto(photoDataUrl) {
  const res = await fetch(photoDataUrl)
  const blob = await res.blob()
  const formData = new FormData()
  formData.append('photo', blob, 'household.jpg')

  const headers = {}
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const uploadRes = await fetch('/api/uploads/photo', {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include'
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({ message: uploadRes.statusText }))
    throw new Error(err.message || err.error || 'Photo upload failed')
  }

  const data = await uploadRes.json()
  return data.photoUrl
}

/**
 * Check if a house code is available (before creating a new survey).
 * POST /api/households/check-house-code
 */
export async function checkHouseCode(houseCode) {
  return apiPost('/api/households/check-house-code', { houseCode })
}

/**
 * Create a new household survey record.
 * POST /api/households
 */
export async function createHousehold(data) {
  return apiPost('/api/households', data)
}

/**
 * List households with optional filters (district, status, search, page).
 * GET /api/households?district=...&status=...&search=...&page=...&limit=...
 */
export async function getHouseholds(params = {}) {
  const qs = new URLSearchParams()
  if (params.district && params.district !== 'all') qs.set('district', params.district)
  if (params.status && params.status !== 'all') qs.set('status', params.status)
  if (params.search) qs.set('search', params.search)
  if (params.taluk && params.taluk !== 'all') qs.set('taluk', params.taluk)
  if (params.wardPanchayat && params.wardPanchayat !== 'all') qs.set('wardPanchayat', params.wardPanchayat)
  if (params.fieldAgentId && params.fieldAgentId !== 'all') qs.set('fieldAgentId', params.fieldAgentId)
  if (params.supervisorId && params.supervisorId !== 'all') qs.set('supervisorId', params.supervisorId)
  if (params.page) qs.set('page', params.page)
  if (params.limit) qs.set('limit', params.limit)
  const query = qs.toString()
  return apiGet(`/api/households${query ? '?' + query : ''}`)
}

/**
 * Get a single household by house code.
 * GET /api/households/:houseCode
 */
export async function getHousehold(houseCode) {
  return apiGet(`/api/households/${houseCode}`)
}

/**
 * Update a household record.
 * PATCH /api/households/:houseCode
 */
export async function updateHousehold(houseCode, data) {
  return apiPatch(`/api/households/${houseCode}`, data)
}

/**
 * Get households by field agent.
 * GET /api/households/by-agent/:agentId
 */
export async function getHouseholdsByAgent(agentId, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', params.page)
  if (params.limit) qs.set('limit', params.limit)
  const query = qs.toString()
  return apiGet(`/api/households/by-agent/${agentId}${query ? '?' + query : ''}`)
}

/**
 * Get households by supervisor (all agents under supervisor).
 * GET /api/households/by-supervisor/:supervisorId
 */
export async function getHouseholdsBySupervisor(supervisorId, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', params.page)
  if (params.limit) qs.set('limit', params.limit)
  if (params.fieldAgentId && params.fieldAgentId !== 'all') qs.set('fieldAgentId', params.fieldAgentId)
  const query = qs.toString()
  return apiGet(`/api/households/by-supervisor/${supervisorId}${query ? '?' + query : ''}`)
}

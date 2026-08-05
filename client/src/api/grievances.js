import { apiGet, apiPost, apiPatch } from './client'

/**
 * Create a grievance (citizen submits for their household).
 * POST /api/grievances
 */
export async function createGrievance(data) {
  return apiPost('/api/grievances', data)
}

/**
 * List grievances (admin sees all, citizen sees own household).
 * GET /api/grievances?houseCode=...&status=...
 */
export async function getGrievances(params = {}) {
  const qs = new URLSearchParams()
  if (params.houseCode) qs.set('houseCode', params.houseCode)
  if (params.status && params.status !== 'all') qs.set('status', params.status)
  if (params.district && params.district !== 'all') qs.set('district', params.district)
  if (params.taluk && params.taluk !== 'all') qs.set('taluk', params.taluk)
  if (params.wardPanchayat && params.wardPanchayat !== 'all') qs.set('wardPanchayat', params.wardPanchayat)
  if (params.supervisorId && params.supervisorId !== 'all') qs.set('supervisorId', params.supervisorId)
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', params.page)
  if (params.limit) qs.set('limit', params.limit)
  const query = qs.toString()
  return apiGet(`/api/grievances${query ? '?' + query : ''}`)
}

/**
 * Get a single grievance.
 * GET /api/grievances/:id
 */
export async function getGrievance(id) {
  return apiGet(`/api/grievances/${id}`)
}

/**
 * Update grievance status (resolve/open).
 * PATCH /api/grievances/:id
 */
export async function updateGrievance(id, data) {
  return apiPatch(`/api/grievances/${id}`, data)
}

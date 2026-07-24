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
  if (params.status) qs.set('status', params.status)
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

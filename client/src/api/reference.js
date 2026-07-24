import { apiGet } from './client'

/**
 * Get all reference options (problems, schemes, income brackets, occupations).
 * GET /api/reference/options
 */
export async function getOptions() {
  return apiGet('/api/reference/options')
}

/**
 * Get locations (districts + taluks).
 * GET /api/reference/locations
 */
export async function getLocations() {
  return apiGet('/api/reference/locations')
}

/**
 * Get emergency numbers.
 * GET /api/reference/emergency
 */
export async function getEmergencyNumbers() {
  return apiGet('/api/reference/emergency')
}

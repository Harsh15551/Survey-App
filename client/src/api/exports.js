import { apiGet } from './client'

/**
 * Export households as CSV.
 * GET /api/exports/households/csv
 */
export async function exportHouseholdsCsv(params = {}) {
  const qs = new URLSearchParams()
  if (params.district) qs.set('district', params.district)
  if (params.status) qs.set('status', params.status)
  const query = qs.toString()
  const url = `/api/exports/households/csv${query ? '?' + query : ''}`
  // Open in new tab for download
  window.open(url, '_blank')
}

import { apiGet } from './client'

/**
 * Get admin dashboard statistics.
 * GET /api/dashboard/stats
 */
export async function getDashboardStats() {
  return apiGet('/api/dashboard/stats')
}

/**
 * Get supervisor hierarchy with agent details.
 * GET /api/dashboard/supervisors
 */
export async function getSupervisorHierarchy() {
  return apiGet('/api/dashboard/supervisors')
}

/**
 * Get team performance statistics (admin/supervisor).
 * GET /api/dashboard/team-stats
 */
export async function getTeamStats() {
  return apiGet('/api/dashboard/team-stats')
}

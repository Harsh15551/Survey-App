import { apiGet, apiPost, apiPatch } from './client'

/**
 * List all users.
 * GET /api/users
 */
export async function getUsers() {
  return apiGet('/api/users')
}

/**
 * Get a single user by ID.
 * GET /api/users/:id
 */
export async function getUser(id) {
  return apiGet(`/api/users/${id}`)
}

/**
 * Create a new user (supervisor or field agent).
 * POST /api/users
 */
export async function createUser(data) {
  return apiPost('/api/users', data)
}

/**
 * Update user (toggle status, reassign supervisor, etc.).
 * PATCH /api/users/:id
 */
export async function updateUser(id, data) {
  return apiPatch(`/api/users/${id}`, data)
}

/**
 * Get all supervisors (for dropdowns).
 * GET /api/users/supervisors
 */
export async function getSupervisors() {
  return apiGet('/api/users/supervisors')
}

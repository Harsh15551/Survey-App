/**
 * Parse and validate pagination parameters from query string
 * Supports offset-based pagination: ?page=1&limit=20
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Build a paginated response object
 */
function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  }
}

module.exports = { parsePagination, paginatedResponse }

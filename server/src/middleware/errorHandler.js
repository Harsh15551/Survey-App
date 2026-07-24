/**
 * Global error handler middleware
 * Catches all unhandled errors and returns consistent JSON response
 */
function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: `A record with this ${err.meta?.target?.join(', ')} already exists.`
    })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' })
  }

  // Zod validation errors that slipped through
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues
    })
  }

  // Default 500
  const status = err.status || 500
  const message = err.expose ? err.message : 'Internal server error'

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

/**
 * 404 handler for unmatched routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
}

module.exports = { errorHandler, notFoundHandler }

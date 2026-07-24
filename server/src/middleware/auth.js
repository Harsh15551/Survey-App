const { verifyAccessToken } = require('../utils/jwt')

/**
 * Verify JWT from Authorization header and attach user info to req
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Provide a Bearer token.' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = verifyAccessToken(token)
    req.user = {
      id: payload.sub,
      role: payload.role || payload.type, // 'admin', 'supervisor', 'field_agent', or 'citizen'
      type: payload.type, // 'staff' or 'citizen'
      phone: payload.phone,
      houseCode: payload.type === 'citizen' ? payload.sub : null
    }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

/**
 * Restrict access to specific roles
 * Usage: requireRoles(['admin', 'supervisor'])
 */
function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` })
    }
    next()
  }
}

module.exports = { authenticate, requireRoles }
